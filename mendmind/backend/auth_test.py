"""
 auth_test.py -- End-to-end test for Reason x login authentication.
Run:  python auth_test.py
"""
import sys
import urllib.request, urllib.error, json

# Force UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://localhost:8000/api/login"

def call(email, password, role="student"):
    req = urllib.request.Request(
        BASE,
        data=json.dumps({"email": email, "password": password, "role": role}).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

CASES = [
    # (description, email, password, role, expected_code)
    ("[BLOCK] Completely missing @",            "notanemail",          "pass123",    "student", 400),
    ("[BLOCK] Fake domain: test.com",           "user@test.com",       "pass123",    "student", 400),
    ("[BLOCK] Fake domain: example.com",        "user@example.com",    "pass123",    "student", 400),
    ("[BLOCK] Fake domain: fake.com",           "hi@fake.com",         "pass123",    "student", 400),
    ("[BLOCK] Fake domain: foo.com",            "me@foo.com",          "pass123",    "student", 400),
    ("[BLOCK] No TLD (single-part domain)",     "user@nodomain",       "pass123",    "student", 400),
    ("[BLOCK] Empty email",                     "",                    "pass123",    "student", 400),
    ("[BLOCK] Password too short (<4 chars)",   "real@mendmind.edu",   "ab",         "student", 400),
    ("[BLOCK] Login cannot auto-register",      "nivet@iitm.ac.in",    "secure123",  "student", 400),
    ("[BLOCK] Unregistered email cannot login", "new-student@mendmind.edu", "secure123", "student", 400),
]

passed = 0
failed = 0

print("=" * 70)
print("Reason x  /api/login  Authentication Test Suite")
print("=" * 70)

for desc, email, password, role, expected_code in CASES:
    code, body = call(email, password, role)
    ok = code == expected_code
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"[{status}] {desc}")
    print(f"       email={email!r}  =>  HTTP {code}")
    if not ok:
        print(f"       EXPECTED HTTP {expected_code}  |  body: {body}")
    elif code == 200:
        user = body.get("user", {})
        print(f"       Authenticated as: {user.get('name')!r} <{user.get('role')}>")
    else:
        print(f"       Blocked: {body.get('detail', '')}")
    print()

print("=" * 70)
print(f"Results: {passed} passed, {failed} failed out of {len(CASES)} tests")
print("=" * 70)
