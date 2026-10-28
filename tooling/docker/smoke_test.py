"""HTTP checks for a running Compose deployment. Python 3, standard library only.

Usage: python tooling/docker/smoke_test.py [http://localhost:8080] [--empty]
Python is a verification tool, not a prerequisite to run the application.
"""
import json
import re
import sys
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080").rstrip("/")
empty = "--empty" in sys.argv[2:]

def fetch(path, headers=None):
    with urlopen(Request(base + path, headers=headers or {}), timeout=30) as response:
        return response.status, response.headers, response.read()

def missing(path, expected=404):
    try:
        fetch(path)
    except HTTPError as error:
        assert error.code == expected, (path, error.code)
    else:
        raise AssertionError("Expected 404: " + path)

status, _, body = fetch("/")
html = body.decode("utf-8")
assert status == 200 and '<div id="root"></div>' in html, "React root missing"
assets = re.findall(r'(?:src|href)="(/assets/[^"]+)"', html)
assert assets, "No production assets"
for asset in assets:
    assert fetch(asset)[0] == 200
status, _, body = fetch("/api/videos")
videos = json.loads(body)
assert status == 200 and isinstance(videos, list)
assert len({video["id"] for video in videos}) == len(videos), "Duplicate video IDs"
if empty:
    assert videos == [], "Expected empty store/catalog"
else:
    assert videos, "Expected imported sample videos"
    video = videos[0]
    _, _, detail = fetch("/api/videos/" + str(video["id"]))
    assert json.loads(detail)["id"] == video["id"]
    assert b'<div id="root"></div>' in fetch("/videos/" + str(video["id"]))[2]
    assert fetch(quote(video["thumbnailUrl"], safe="/"))[0] == 200
    status, headers, chunk = fetch(quote(video["videoUrl"], safe="/"), {"Range": "bytes=0-31"})
    assert status == 206 and len(chunk) == 32 and headers.get("Content-Range", "").startswith("bytes 0-31/"), "Video Range failed"
missing("/media/protube-missing-check.mp4")
missing("/api/protube-missing-check", expected=401)
missing("/api/videos/9223372036854775807")
print("PASS: React, assets, API, catalog=" + str(len(videos)) + (", empty state" if empty else ", detail, direct route, thumbnail, video Range") + ", missing resources")
