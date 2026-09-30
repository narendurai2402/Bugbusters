from questions import QUESTION_BANKS, QUESTIONS


def test_dsa_questions_are_available():
    dsa_questions = [q for q in QUESTIONS.values() if q.get("category") == "DSA"]
    assert dsa_questions, "DSA question bank should not be empty"
    assert any(q["concept"] == "Binary Search" for q in dsa_questions)


def test_question_bank_has_enough_variety_for_new_questions():
    assert len(QUESTIONS) >= 12, "Question bank should include multiple fresh problems, not a tiny repeating set"
    assert len(QUESTION_BANKS["Math"]) >= 6, "Math bank should include a broad set of problems"
    assert len(QUESTION_BANKS["DSA"]) >= 6, "DSA bank should include a broad set of problems"
    assert len({q["concept"] for q in QUESTIONS.values()}) >= 10, "Question bank should cover many concept areas"


def test_python_and_java_question_banks_are_available():
    for subject in ("Python", "Java"):
        questions = QUESTION_BANKS[subject]
        assert len(questions) >= 3
        assert all(question["category"] == subject for question in questions)
