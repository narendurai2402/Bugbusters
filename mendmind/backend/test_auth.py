import os
import unittest
import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient

import main
import state


client = TestClient(main.app)


class AuthenticationTests(unittest.TestCase):
    def test_fresh_student_has_no_progress_records(self):
        email = f"fresh-{uuid.uuid4().hex}@mendmind.edu"
        learner_state = client.get(f"/api/state/{email}")
        analytics = client.get(f"/api/analytics/student/{email}")

        self.assertEqual(learner_state.status_code, 200)
        self.assertTrue(all(value == 0 for value in learner_state.json()["mastery"].values()))
        self.assertEqual(analytics.status_code, 200)
        self.assertEqual(analytics.json()["totalAttempts"], 0)
        self.assertEqual(analytics.json()["questionsSolved"], 0)
        self.assertIsNone(analytics.json()["firstTryAccuracy"])
        self.assertEqual(analytics.json()["recoveriesCompleted"], 0)

    def test_signup_requires_correct_otp_and_creates_login_account(self):
        email = f"otp-{uuid.uuid4().hex}@mendmind.edu"
        delivered = {}
        send_email = lambda to, name, code: delivered.update(to=to, code=code)
        try:
            with patch.object(main, "send_signup_email", side_effect=send_email):
                response = client.post("/api/signup", json={
                    "email": email,
                    "password": "secure-password",
                    "name": "Kumar Teacher",
                    "role": "teacher",
                })
                self.assertEqual(response.status_code, 200, response.text)
                self.assertEqual(delivered["to"], email)
                duplicate = client.post("/api/signup", json={
                    "email": email,
                    "password": "different-password",
                    "name": "Different Name",
                    "role": "student",
                })
                self.assertEqual(duplicate.status_code, 409)
                self.assertEqual(client.post("/api/signup/verify", json={"email": email, "code": "000000"}).status_code, 400)

                verified = client.post("/api/signup/verify", json={"email": email, "code": delivered["code"]})
                self.assertEqual(verified.status_code, 200, verified.text)
                self.assertEqual(verified.json()["user"], {"name": "Kumar Teacher", "email": email, "role": "teacher"})

                login = client.post("/api/login", json={"email": email, "password": "secure-password", "role": "teacher"})
                self.assertEqual(login.status_code, 200, login.text)
                self.assertEqual(login.json()["user"]["name"], "Kumar Teacher")
                self.assertEqual(client.post("/api/signup/verify", json={"email": email, "code": delivered["code"]}).status_code, 404)
        finally:
            state._q("delete from signup_challenges where email=?", (email,))
            state._q("delete from users where lower(email)=?", (email,))

    def test_signup_fails_without_smtp_configuration(self):
        email = f"no-smtp-{uuid.uuid4().hex}@mendmind.edu"
        smtp_settings = {"SMTP_HOST": "", "SMTP_FROM": "", "SMTP_USERNAME": ""}
        with patch.dict(os.environ, smtp_settings):
            response = client.post("/api/signup", json={
                "email": email,
                "password": "secure-password",
                "name": "No Mail",
                "role": "student",
            })
        self.assertEqual(response.status_code, 503)
        self.assertIsNone(state.get_signup_challenge(email))


    def test_demo_signup_allows_example_email_without_smtp(self):
        email = f"demo-{uuid.uuid4().hex}@example.com"
        with patch.dict(os.environ, {
            "ALLOW_DEMO_EMAILS": "true",
            "SMTP_HOST": "",
            "SMTP_FROM": "",
            "SMTP_USERNAME": "",
        }, clear=False):
            response = client.post("/api/signup", json={
                "email": email,
                "password": "secure-password",
                "name": "Demo User",
                "role": "student",
            })
            self.assertEqual(response.status_code, 200, response.text)
            self.assertIn("demoCode", response.json())
            code = response.json()["demoCode"]
            verify = client.post("/api/signup/verify", json={"email": email, "code": code})
            self.assertEqual(verify.status_code, 200, verify.text)
            login = client.post("/api/login", json={"email": email, "password": "secure-password", "role": "student"})
            self.assertEqual(login.status_code, 200, login.text)
            self.assertEqual(login.json()["user"]["name"], "Demo User")
        state._q("delete from signup_challenges where email=?", (email,))
        state._q("delete from users where lower(email)=?", (email,))

    def test_social_auth_registers_and_returns_user(self):
        provider = "google"
        name = "Google Demo User"
        response = client.post("/api/auth/social", json={"provider": provider, "name": name, "role": "student"})
        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertEqual(payload["provider"], provider)
        self.assertEqual(payload["user"]["name"], name)
        self.assertEqual(payload["user"]["role"], "student")
        self.assertIsNotNone(state.get_user(payload["user"]["email"]))

        duplicate = client.post("/api/auth/social", json={"provider": provider, "name": "Updated Name", "role": "student"})
        self.assertEqual(duplicate.status_code, 200, duplicate.text)
        self.assertEqual(duplicate.json()["user"]["name"], name)

    def test_login_does_not_auto_register_unknown_email(self):
        email = f"unknown-{uuid.uuid4().hex}@mendmind.edu"
        response = client.post("/api/login", json={"email": email, "password": "secure-password", "role": "student"})
        self.assertEqual(response.status_code, 400)
        self.assertIsNone(state.get_user(email))