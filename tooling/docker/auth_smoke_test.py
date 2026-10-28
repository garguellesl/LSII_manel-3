"""Verify authentication against an isolated running production deployment.

Usage: python tooling/docker/auth_smoke_test.py http://localhost:18080
Creates disposable accounts: run against a test database, not the team's data.
No passwords, session IDs or CSRF tokens are printed.
"""
import http.cookiejar
import json
import secrets
import sys
import uuid
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener

base = sys.argv[1].rstrip("/")

class Client:
    def __init__(self):
        self.cookies = http.cookiejar.CookieJar()
        self.http = build_opener(HTTPCookieProcessor(self.cookies))

    def request(self, method, path, body=None, headers=None, expected=200):
        data = None if body is None else json.dumps(body).encode()
        headers = {"Content-Type": "application/json", **(headers or {})}
        try:
            response = self.http.open(Request(base + path, data=data, headers=headers, method=method), timeout=30)
        except HTTPError as error:
            response = error
        assert response.code == expected, (method, path, response.code, expected)
        payload = response.read()
        result = json.loads(payload) if payload and "application/json" in response.headers.get("Content-Type", "") else payload
        return result, response.headers

    def token(self):
        result, _ = self.request("GET", "/api/auth/csrf")
        return {result["headerName"]: result["token"]}

    def session_id(self):
        return next((cookie.value for cookie in self.cookies if cookie.name == "JSESSIONID"), None)

first = Client()
second = Client()
for path in ("/", "/login", "/register", "/profile"):
    page, _ = first.request("GET", path)
    assert b'<div id="root"></div>' in page
first.request("GET", "/api/users/me", expected=401)
first.request("POST", "/api/auth/login", {}, expected=403)

def register(client):
    token = client.token()
    before = client.session_id()
    name = "auth-check-" + uuid.uuid4().hex[:12]
    credentials = {"email": name + "@example.test", "password": secrets.token_urlsafe(18)}
    user, headers = client.request("POST", "/api/auth/register", {
        **credentials, "accountName": name, "firstName": "Docker", "lastName": "Check"
    }, token, expected=201)
    assert client.session_id() != before, "Session fixation protection failed"
    cookie = headers.get("Set-Cookie", "").lower()
    assert "httponly" in cookie and "samesite=lax" in cookie, "Session cookie policy missing"
    assert "password" not in user and "passwordHash" not in user
    return user, credentials, token

# The demo owner may sign in; its identity is reserved from public registration.
import os
demo = Client()
demo_credentials = {
    "email": os.environ.get("ENV_PROTUBE_DEMO_ADMIN_EMAIL", "admin@protube.local"),
    "password": os.environ["ENV_PROTUBE_DEMO_ADMIN_PASSWORD"],
}
demo_user, _ = demo.request("POST", "/api/auth/login", demo_credentials, demo.token())
assert demo_user["accountName"] == os.environ.get("ENV_PROTUBE_DEMO_ADMIN_ACCOUNT", "admin")
catalog, _ = demo.request("GET", "/api/videos")
assert catalog, "Run this smoke test with an imported test catalog"
video_id = str(catalog[0]["id"])
video, _ = demo.request("GET", "/api/videos/" + video_id)
assert video["user"] == demo_user["accountName"], "Imported owner association was not preserved"
demo.request("PATCH", "/api/videos/" + video_id, {"title": video["title"]}, demo.token())

first.request("POST", "/api/auth/register", {
    "email": demo_credentials["email"], "accountName": "reserved-check",
    "firstName": "Test", "lastName": "Check", "password": "password123"
}, first.token(), expected=400)
user, credentials, old_token = register(first)
other, _, _ = register(second)
second.request("PATCH", "/api/videos/" + video_id, {"title": "Forbidden edit"}, second.token(), expected=403)
demo.request("GET", "/api/users/" + str(user["id"]) + "/watch-history", expected=403)
profile, _ = first.request("GET", "/api/users/me?userId=" + str(other["id"]))
assert profile["id"] == user["id"], "Client selected another profile"
second.request("GET", "/api/users/" + str(user["id"]) + "/watch-history", expected=403)
second.request("GET", "/api/users/" + str(user["id"]) + "/analytics", expected=403)
first.request("POST", "/api/auth/logout", {}, old_token, expected=403)
first.request("POST", "/api/auth/logout", {}, first.token(), expected=204)
first.request("GET", "/api/users/me", expected=401)
first.request("POST", "/api/auth/login", {**credentials, "password": "wrong-password"}, first.token(), expected=401)
first.request("GET", "/api/users/me", expected=401)
first.request("POST", "/api/auth/login", credentials, first.token())
profile, _ = first.request("GET", "/api/users/me")
assert profile["id"] == user["id"]
first.request("POST", "/api/auth/logout", {}, first.token(), expected=204)
second.request("POST", "/api/auth/logout", {}, second.token(), expected=204)
demo.request("POST", "/api/auth/logout", {}, demo.token(), expected=204)
print("PASS: production SPA routes, demo owner login without global privileges, registration auto-login, session/cookie policy, CSRF rotation, own profile, private data isolation, failed login, login and logout")
