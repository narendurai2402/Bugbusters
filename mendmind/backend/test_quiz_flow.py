import unittest
import uuid

from fastapi.testclient import TestClient

import main
import questions
import state


client = TestClient(main.app)


class QuizFlowTests(unittest.TestCase):
    def setUp(self):
        self.student = f"quiz-test-{uuid.uuid4().hex}"
        self.sessions = []

    def tearDown(self):
        for session_id in self.sessions:
            state._q("delete from quiz_sessions where session_id=?", (session_id,))
        for table in ("attempts", "mastery", "mastery_log", "misc"):
            state._q(f"delete from {table} where student=?", (self.student,))

    def start(self, subject="all"):
        response = client.post("/api/quizzes/start", json={"studentId": self.student, "subject": subject})
        self.assertEqual(response.status_code, 200, response.text)
        session_id = response.json()["sessionId"]
        self.sessions.append(session_id)
        return session_id, state.get_quiz_session(session_id)

    def answer(self, session_id, text):
        return client.post(
            f"/api/quizzes/{session_id}/answer",
            json={"studentId": self.student, "answer": text},
        )

    def test_catalog_has_ten_questions_per_subject(self):
        self.assertEqual({name: len(bank) for name, bank in questions.SUBJECTS.items()}, {
            "Math": 10, "DSA": 10, "Science": 10, "Python": 10, "Java": 10,
        })
        session_id, _ = self.start()
        self.assertEqual(client.get(f"/api/quizzes/{session_id}", params={"studentId": self.student}).json()["total"], 50)

    def test_recovery_question_blocks_next_question_until_correct(self):
        session_id, session = self.start("Python")
        q = questions.QUESTIONS[session["question_ids"][0]]
        wrong = next(iter(q["wrong"]))
        for expected_stage in ("first_miss", "hint", "recovery"):
            response = self.answer(session_id, wrong)
            self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(response.json()["stage"], expected_stage)

        blocked = self.answer(session_id, q["recovery"]["wrong"])
        self.assertEqual(blocked.json()["stage"], "recovery_retry")
        current = client.get(f"/api/quizzes/{session_id}", params={"studentId": self.student}).json()
        self.assertEqual((current["phase"], current["questionNumber"]), ("recovery", 1))

        recovered = self.answer(session_id, q["recovery"]["answers"][0])
        self.assertEqual(recovered.json()["stage"], "recovered")
        self.assertEqual(recovered.json()["next"]["questionNumber"], 2)

    def test_first_try_correct_advances_without_recovery(self):
        session_id, session = self.start("Java")
        q = questions.QUESTIONS[session["question_ids"][0]]
        response = self.answer(session_id, q["answers"][0])
        self.assertEqual(response.json()["stage"], "first_try")
        self.assertEqual(response.json()["next"]["questionNumber"], 2)
        self.assertEqual(response.json()["next"]["phase"], "question")


if __name__ == "__main__":
    unittest.main()
