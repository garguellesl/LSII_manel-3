"""One-off, guarded tag restoration; credentials come from the active app container.

Run prepare first, then apply with the printed backup directory. No media is touched.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
import subprocess
from datetime import datetime, timezone


def run(args, *, env=None, sql=None):
    result = subprocess.run(args, input=sql, text=True, encoding="utf-8",
                            capture_output=True, env=env)
    if result.returncode:
        diagnostic = result.stderr
        for key in ['PGPASSWORD', 'PGUSER', 'PGHOST', 'PGDATABASE', 'POSTGRES_PASSWORD']:
            if env and env.get(key):
                diagnostic = diagnostic.replace(env[key], '[redacted]')
        raise RuntimeError(f"{args[0]} operation failed (exit {result.returncode}): {diagnostic}")
    return result.stdout


SNAPSHOT = """
SELECT json_build_object(
 'tags',(SELECT coalesce(json_agg(t ORDER BY id),'[]') FROM protube.tags t),
 'video_tags',(SELECT coalesce(json_agg(t ORDER BY video_id,tag_id),'[]') FROM protube.video_tags t),
 'videos',(SELECT coalesce(json_agg(t ORDER BY id),'[]') FROM protube.videos t));
"""


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def build_sql(before, desired):
    def literal(value):
        return "'" + json.dumps(value, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return """BEGIN;
SET LOCAL lock_timeout = '15s';
SET LOCAL statement_timeout = '60s';
LOCK TABLE protube.videos, protube.tags, protube.video_tags IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE expected_snapshot (data jsonb);
INSERT INTO expected_snapshot VALUES (""" + literal(before) + """);
DO $$ BEGIN
 IF (SELECT data FROM expected_snapshot) <> jsonb_build_object(
 'tags',(SELECT coalesce(jsonb_agg(t ORDER BY id),'[]') FROM protube.tags t),
 'video_tags',(SELECT coalesce(jsonb_agg(t ORDER BY video_id,tag_id),'[]') FROM protube.video_tags t),
 'videos',(SELECT coalesce(jsonb_agg(t ORDER BY id),'[]') FROM protube.videos t))
 THEN RAISE EXCEPTION 'Data changed since backup; aborting'; END IF;
END $$;
CREATE TEMP TABLE desired_tags (data jsonb);
INSERT INTO desired_tags VALUES (""" + literal(desired) + """);
DELETE FROM protube.video_tags;
DELETE FROM protube.tags;
INSERT INTO protube.tags(name)
 SELECT name FROM desired_tags, jsonb_to_recordset(data->'tags') AS t(id bigint,name text) ORDER BY id;
INSERT INTO protube.video_tags(video_id,tag_id)
 SELECT link.video_id, actual.id FROM desired_tags d,
 jsonb_to_recordset(d.data->'video_tags') AS link(video_id bigint,tag_id bigint)
 JOIN jsonb_to_recordset((SELECT data->'tags' FROM desired_tags)) AS source(id bigint,name text)
 ON source.id=link.tag_id JOIN protube.tags actual ON actual.name=source.name;
UPDATE protube.videos SET tags_initialized=true WHERE NOT tags_initialized;
DO $$ BEGIN
 IF (SELECT count(*) FROM protube.tags) <> 54 OR
    (SELECT count(*) FROM protube.video_tags) <> 124 THEN
 RAISE EXCEPTION 'Unexpected final counts'; END IF;
 IF EXISTS (SELECT 1 FROM protube.videos WHERE NOT tags_initialized) THEN
 RAISE EXCEPTION 'Initialization missing'; END IF;
 IF (SELECT jsonb_agg(to_jsonb(v)-'tags_initialized' ORDER BY id) FROM protube.videos v)
 <> (SELECT jsonb_agg(v-'tags_initialized' ORDER BY (v->>'id')::bigint)
 FROM expected_snapshot, jsonb_array_elements(data->'videos') v) THEN
 RAISE EXCEPTION 'Unrelated video metadata changed'; END IF;
END $$;
COMMIT;
"""


def verify(snapshot, desired):
    names = {t['id']: t['name'] for t in snapshot['tags']}
    wanted = {t['id']: t['name'] for t in desired['tags']}
    assert set(names.values()) == set(wanted.values())
    assert {(r['video_id'], names[r['tag_id']]) for r in snapshot['video_tags']} == {
        (r['video_id'], wanted[r['tag_id']]) for r in desired['video_tags']}
    assert all(v['tags_initialized'] for v in snapshot['videos'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['prepare', 'apply'])
    parser.add_argument('--directory')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    desired = json.loads((root / 'tags-backup-before-manual-20261118-092828.json').read_text(encoding='utf-8'))
    source_digest = digest(desired)
    assert len(desired['tags']) == 54 and len(desired['video_tags']) == 124
    directory = Path(args.directory).resolve() if args.directory else root / 'database-backups' / (
        'tags-restore-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    if args.mode == 'prepare':
        directory.mkdir(parents=True, exist_ok=False)
    else:
        assert args.directory and (directory / 'prepared.json').is_file()
    app = json.loads(run(['docker', 'inspect', 'lsii_manel-3-app-1']))[0]
    config = dict(entry.split('=', 1) for entry in app['Config']['Env'])
    assert 'supabase' in config['ENV_PROTUBE_DB_HOST']
    assert 'currentSchema=protube' in config['SPRING_DATASOURCE_URL']
    env = os.environ.copy()
    env.update(PGHOST=config['ENV_PROTUBE_DB_HOST'], PGPORT=config.get('ENV_PROTUBE_DB_PORT', '5432'),
               PGDATABASE=config['ENV_PROTUBE_DB'], PGUSER=config['ENV_PROTUBE_DB_USER'],
               PGPASSWORD=config['ENV_PROTUBE_DB_PASS'], PGSSLMODE='require', PGCONNECT_TIMEOUT='20')
    remote = ['docker', 'run', '--rm', '-i']
    for key in ['PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGSSLMODE', 'PGCONNECT_TIMEOUT']:
        remote += ['-e', key]
    remote += ['-v', str(directory) + ':/work', 'postgres:17-alpine']
    psql = ['psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1']
    if args.mode == 'prepare':
        before = json.loads(run(remote + psql, env=env, sql=SNAPSHOT))
        (directory / 'before.json').write_text(json.dumps(before, ensure_ascii=False, indent=2), encoding='utf-8')
        mapping = {}
        for video in desired['videos']:
            matches = [v for v in before['videos'] if v['title'] == video['title']]
            if len(matches) != 1:
                raise RuntimeError(f"Missing or ambiguous exact title for backup ID {video['id']}")
            mapping[video['id']] = matches[0]['id']
        assert len(set(mapping.values())) == len(mapping)
        for link in desired['video_tags']:
            link['video_id'] = mapping[link['video_id']]
        for video in desired['videos']:
            video['id'] = mapping[video['id']]
        (directory / 'mapped-desired.json').write_text(json.dumps(desired, ensure_ascii=False), encoding='utf-8')
        (directory / 'before.json').write_text(json.dumps(before, ensure_ascii=False, indent=2), encoding='utf-8')
        run(remote + ['pg_dump', '--format=custom', '--schema=protube', '--no-owner', '--no-privileges',
                      '--file=/work/snapshot.dump'], env=env)
        sql = build_sql(before, desired)
        (directory / 'apply.sql').write_text(sql, encoding='utf-8')
        container = 'protube-tags-rehearsal-' + secrets.token_hex(4)
        local_env = os.environ.copy()
        local_env['POSTGRES_PASSWORD'] = secrets.token_urlsafe(24)
        run(['docker', 'run', '-d', '--name', container, '-e', 'POSTGRES_PASSWORD',
             '-v', str(directory) + ':/work:ro', 'postgres:17-alpine'], env=local_env)
        try:
            import time
            for _ in range(30):
                ready = subprocess.run(['docker', 'exec', container, 'pg_isready', '-U', 'postgres'], capture_output=True)
                if ready.returncode == 0:
                    break
                time.sleep(1)
            run(['docker', 'exec', container, 'pg_restore', '-U', 'postgres', '-d', 'postgres',
                 '--exit-on-error', '--no-owner', '--no-privileges', '/work/snapshot.dump'])
            local = ['docker', 'exec', '-i', container] + psql + ['-U', 'postgres']
            restored = json.loads(run(local, sql=SNAPSHOT))
            assert restored == before, 'Restored snapshot differs'
            run(local, sql=sql)
            verify(json.loads(run(local, sql=SNAPSHOT)), desired)
        finally:
            run(['docker', 'rm', '-f', '-v', container])
        manifest = dict(before_tags=len(before['tags']), before_links=len(before['video_tags']),
                        videos=len(before['videos']), desired_sha256=digest(desired),
                        source_sha256=source_digest, video_id_mapping=mapping,
                        sql_sha256=hashlib.sha256(sql.encode()).hexdigest(),
                        dump_sha256=hashlib.sha256((directory / 'snapshot.dump').read_bytes()).hexdigest(),
                        isolated_restore_and_rehearsal='passed')
        (directory / 'prepared.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
        print(json.dumps(dict(directory=str(directory), **manifest), indent=2))
    else:
        manifest = json.loads((directory / 'prepared.json').read_text())
        assert source_digest == manifest['source_sha256']
        desired = json.loads((directory / 'mapped-desired.json').read_text(encoding='utf-8'))
        sql = (directory / 'apply.sql').read_text(encoding='utf-8')
        assert digest(desired) == manifest['desired_sha256']
        assert hashlib.sha256(sql.encode()).hexdigest() == manifest['sql_sha256']
        assert hashlib.sha256((directory / 'snapshot.dump').read_bytes()).hexdigest() == manifest['dump_sha256']
        run(remote + psql, env=env, sql=sql)
        after = json.loads(run(remote + psql, env=env, sql=SNAPSHOT))
        verify(after, desired)
        tagged = {r['video_id'] for r in after['video_tags']}
        report = dict(tags=len(after['tags']), links=len(after['video_tags']), videos=len(after['videos']),
                      untagged=[dict(id=v['id'], title=v['title']) for v in after['videos'] if v['id'] not in tagged])
        (directory / 'result.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
