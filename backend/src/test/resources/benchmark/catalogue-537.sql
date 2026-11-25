-- Dedicated, empty Testcontainers database. Fixed arithmetic seed 58.
insert into app_users(id,email,account_name,first_name,last_name,password_hash)
select n, 'bench-' || n || '@example.test', 'bench-' || n, 'Bench', 'User', 'unused'
from generate_series(1,64) n;

insert into videos(id,title,description,media_path,owner_user_id)
select n, 'Benchmark ' || n, 'Group ' || (n % 8), 'bench/' || n || '.mp4', 1 + (n % 64)
from generate_series(1,537) n;

insert into tags(id,name) select n, 'tag-' || n from generate_series(1,8) n;
insert into video_tags(video_id,tag_id)
select n, 1 + ((n + offset_tag + 58) % 8)
from generate_series(1,537) n cross join generate_series(0,2) offset_tag
where n % 5 <> 0;

insert into video_likes(video_id,user_id,reaction_type)
select 1 + (n % 500), 1 + ((n % 500 + n / 500 * 13 + 58) % 64),
       case when n % 4 = 0 then 'DISLIKE' else 'LIKE' end
from generate_series(0,5369) n;

insert into comments(video_id,user_id,text,deleted_at)
select 1 + (n % 480), 1 + ((n + 58) % 64), 'Benchmark comment',
       case when n % 11 = 0 then timestamp '2026-01-01' end
from generate_series(0,2684) n;

insert into video_plays(id,video_id)
select md5('scrum58-' || n)::uuid, 1 + (n % 520) from generate_series(0,1073) n;
