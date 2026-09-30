"""Persistent learner state & user authentication (SQLite)."""
import hashlib, hmac, json, os, secrets, sqlite3, threading, re, logging

logger = logging.getLogger(__name__)

from questions import CONCEPTS, INITIAL_MASTERY

_lock = threading.Lock()
_db = sqlite3.connect(os.getenv("DB_PATH", "mendmind.db"), check_same_thread=False)
_db.executescript("""
create table if not exists mastery(student text, concept text, value real, primary key(student, concept));
create table if not exists misc(student text, concept text, label text, n integer default 0, primary key(student, concept, label));
create table if not exists attempts(id integer primary key autoincrement, student text, qid text, answer text,
  correct int, attempt int, label text, ts text default current_timestamp);
create table if not exists quiz_sessions(session_id text primary key, student text, subject text, question_ids text,
    question_index integer default 0, phase text default 'question', attempts integer default 0,
    score integer default 0, created_at text default current_timestamp);
create table if not exists users(email text primary key, password text, name text, role text);
create table if not exists signup_challenges(email text primary key, password_hash text, name text, role text,
    otp_hash text, attempts integer default 0, created_at real, expires_at real, last_sent real);
create table if not exists mastery_log(id integer primary key autoincrement, student text, concept text,
  value real, overall real, ts text default current_timestamp);
create table if not exists assignments(id integer primary key autoincrement, title text, subject text, qids text,
  mode text, students text, due text, note text, teacher text, created text default current_timestamp);
""")


def _q(sql: str, args: tuple = ()):
    """Execute a SQL statement with thread safety. Raises RuntimeError on DB failure."""
    try:
        with _lock:
            cur = _db.execute(sql, args)
            _db.commit()
            return cur.fetchall()
    except sqlite3.Error as exc:
        logger.error("Database error: %s | sql=%r args=%r", exc, sql, args)
        raise RuntimeError(f"Database error: {exc}") from exc


EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
DISALLOWED_DOMAINS = frozenset([
    "test.com", "example.com", "fake.com", "foo.com", "bar.com",
    "asdf.com", "abc.com", "temp.com", "mailinator.com", "guerrillamail.com",
    "throwam.com", "yopmail.com", "trashmail.com",
])


def is_valid_email(email: str) -> bool:
    """Return True only for structurally valid, non-disposable emails unless demo mode is enabled."""
    if not email or not isinstance(email, str):
        return False
    email = email.strip().lower()
    if not EMAIL_REGEX.match(email):
        return False
    if os.getenv("ALLOW_DEMO_EMAILS", "false").lower() == "true":
        return True
    domain = email.split("@")[-1]
    if domain in DISALLOWED_DOMAINS:
        return False
    return True


def get_user(email: str) -> dict | None:
    """Look up a user by email. Returns None if not found."""
    try:
        rows = _q("select email, password, name, role from users where lower(email)=?", (email.strip().lower(),))
        if not rows:
            return None
        r = rows[0]
        return {"email": r[0], "password": r[1], "name": r[2], "role": r[3]}
    except RuntimeError:
        return None


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"pbkdf2_sha256$310000${salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    if not stored.startswith("pbkdf2_sha256$"):
        return hmac.compare_digest(password, stored)
    try:
        _, rounds, salt_hex, digest_hex = stored.split("$", 3)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds))
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_signup_challenge(email: str, password_hash: str, name: str, role: str,
                            otp_hash: str, now: float, expires_at: float) -> None:
    _q(
        "insert or replace into signup_challenges(email,password_hash,name,role,otp_hash,attempts,created_at,expires_at,last_sent) "
        "values(?,?,?,?,?,0,?,?,?)",
        (email, password_hash, name, role, otp_hash, now, expires_at, now),
    )


def get_signup_challenge(email: str) -> dict | None:
    rows = _q(
        "select password_hash,name,role,otp_hash,attempts,created_at,expires_at,last_sent "
        "from signup_challenges where email=?",
        (email,),
    )
    if not rows:
        return None
    row = rows[0]
    return dict(zip(("password_hash", "name", "role", "otp_hash", "attempts", "created_at", "expires_at", "last_sent"), row))


def update_signup_challenge(email: str, otp_hash: str, now: float, expires_at: float) -> None:
    _q(
        "update signup_challenges set otp_hash=?,attempts=0,created_at=?,expires_at=?,last_sent=? where email=?",
        (otp_hash, now, expires_at, now, email),
    )


def increment_signup_attempts(email: str) -> int:
    _q("update signup_challenges set attempts=attempts+1 where email=?", (email,))
    rows = _q("select attempts from signup_challenges where email=?", (email,))
    return rows[0][0] if rows else 0


def delete_signup_challenge(email: str) -> None:
    _q("delete from signup_challenges where email=?", (email,))


def create_verified_user(email: str, password_hash: str, name: str, role: str) -> None:
    _q("insert into users values(?,?,?,?)", (email, password_hash, name, role))


def create_quiz_session(session_id: str, student: str, subject: str, question_ids: list[str]) -> None:
    _q(
        "insert into quiz_sessions(session_id,student,subject,question_ids) values(?,?,?,?)",
        (session_id, student, subject, json.dumps(question_ids)),
    )


def get_quiz_session(session_id: str) -> dict | None:
    rows = _q(
        "select session_id,student,subject,question_ids,question_index,phase,attempts,score "
        "from quiz_sessions where session_id=?",
        (session_id,),
    )
    if not rows:
        return None
    row = rows[0]
    return {
        "session_id": row[0],
        "student": row[1],
        "subject": row[2],
        "question_ids": json.loads(row[3]),
        "question_index": row[4],
        "phase": row[5],
        "attempts": row[6],
        "score": row[7],
    }


def update_quiz_session(session_id: str, question_index: int, phase: str, attempts: int, score: int) -> None:
    _q(
        "update quiz_sessions set question_index=?,phase=?,attempts=?,score=? where session_id=?",
        (question_index, phase, attempts, score, session_id),
    )


def register_or_authenticate_user(email: str, password: str, role: str = "student", name: str | None = None):
    """Validate and authenticate an existing account. Returns (user_dict, error_str)."""
    if not email or not isinstance(email, str):
        return None, "Email address is required."
    email = email.strip().lower()
    if not is_valid_email(email):
        return None, "Invalid email address structure. Please provide a real email address (e.g. name@domain.com)."

    try:
        existing = get_user(email)
        if not existing:
            return None, "No account exists for this email. Please sign up first."
        if not _verify_password(password, existing["password"]):
            return None, "Incorrect password for this account."
        if role != existing["role"]:
            return None, f"This account is registered as a {existing['role']}."
        if not existing["password"].startswith("pbkdf2_sha256$"):
            _q("update users set password=? where lower(email)=?", (hash_password(password), email))
        existing["password"] = ""
        return existing, None

    except RuntimeError as exc:
        logger.error("register_or_authenticate_user failed: %s", exc)
        return None, "A database error occurred. Please try again."


def get_mastery(student: str) -> dict:
    """Return concept mastery for a student, falling back to initial values."""
    try:
        rows = dict(_q("select concept, value from mastery where student=?", (student,)))
        return {c: max(0.0, min(1.0, rows.get(c, INITIAL_MASTERY[c]))) for c in CONCEPTS}
    except RuntimeError:
        return dict(INITIAL_MASTERY)


def set_mastery(student: str, concept: str, value: float):
    """Persist mastery value, clamped to [0, 1]."""
    if concept not in CONCEPTS:
        logger.warning("set_mastery: unknown concept %r — skipping.", concept)
        return
    try:
        value = max(0.0, min(1.0, value))
        _q(
            "insert into mastery values(?,?,?) on conflict(student,concept) do update set value=excluded.value",
            (student, concept, value),
        )
        current = get_mastery(student)
        overall = sum(current.values()) / len(current)
        _q("insert into mastery_log(student,concept,value,overall) values(?,?,?,?)", (student, concept, value, overall))
    except RuntimeError:
        pass  # Non-fatal: mastery update loss is acceptable over a crash


def add_misconception(student: str, concept: str, label: str):
    """Increment misconception count. Silently no-ops on DB failure."""
    if not label:
        return
    try:
        _q(
            "insert into misc values(?,?,?,1) on conflict(student,concept,label) do update set n=n+1",
            (student, concept, label),
        )
    except RuntimeError:
        pass


def clear_misconceptions(student: str, concept: str):
    """Delete all misconception records for a student/concept."""
    try:
        _q("delete from misc where student=? and concept=?", (student, concept))
    except RuntimeError:
        pass


def log_attempt(student: str, qid: str, answer: str, correct: bool, attempt: int, label: str | None):
    """Append an attempt record. Silently no-ops on DB failure."""
    try:
        _q(
            "insert into attempts(student,qid,answer,correct,attempt,label) values(?,?,?,?,?,?)",
            (student, qid, answer, int(correct), attempt, label),
        )
    except RuntimeError:
        pass


def real_students() -> list:
    """Return list of student IDs who have mastery records."""
    try:
        return [r[0] for r in _q("select distinct student from mastery")]
    except RuntimeError:
        return []


def misconception_counts() -> dict:
    """Return {label: total_count} across all students."""
    try:
        return dict(_q("select label, sum(n) from misc group by label"))
    except RuntimeError:
        return {}


# ── Analytics queries ──────────────────────────────────────────────────────
def attempts_for(student: str) -> list:
    """All attempts for a student, oldest first: (qid, correct, attempt, label, ts)."""
    try:
        return _q("select qid, correct, attempt, label, ts from attempts where student=? order by id", (student,))
    except RuntimeError:
        return []


def last_question(student: str) -> str | None:
    """Most recent (non-recovery) question id the student answered."""
    try:
        rows = _q("select qid from attempts where student=? and qid not like '%:recovery' order by id desc limit 1", (student,))
        return rows[0][0] if rows else None
    except RuntimeError:
        return None


def mastery_history(student: str, limit: int = 60) -> list:
    """Overall-mastery trend, oldest first: [(ts, overall)]."""
    try:
        rows = _q("select ts, overall from mastery_log where student=? order by id desc limit ?", (student, limit))
        return list(reversed(rows))
    except RuntimeError:
        return []


def question_stats() -> dict:
    """{qid: (first_try_total, first_try_correct)} across all students."""
    try:
        rows = _q(
            "select qid, count(*), sum(correct) from attempts "
            "where attempt=1 and qid not like '%:recovery' group by qid"
        )
        return {r[0]: (r[1], r[2] or 0) for r in rows}
    except RuntimeError:
        return {}


def daily_activity(days: int = 14) -> list:
    """Attempts per day, oldest first: [(date, count)]."""
    try:
        rows = _q("select date(ts), count(*) from attempts group by date(ts) order by date(ts) desc limit ?", (days,))
        return list(reversed(rows))
    except RuntimeError:
        return []


def total_attempts() -> int:
    try:
        return _q("select count(*) from attempts")[0][0]
    except RuntimeError:
        return 0


def _assignment(row) -> dict:
    return {
        "id": row[0],
        "title": row[1],
        "subject": row[2],
        "questionIds": json.loads(row[3]),
        "mode": row[4],
        "students": json.loads(row[5]),
        "due": row[6],
        "note": row[7],
        "teacher": row[8],
        "created": row[9],
    }


def create_assignment(title: str, subject: str, question_ids: list[str], mode: str,
                      students: list[str], due: str | None, note: str, teacher: str) -> dict:
    _q(
        "insert into assignments(title,subject,qids,mode,students,due,note,teacher) values(?,?,?,?,?,?,?,?)",
        (title, subject, json.dumps(question_ids), mode, json.dumps(students), due, note, teacher),
    )
    rows = _q(
        "select id,title,subject,qids,mode,students,due,note,teacher,created "
        "from assignments order by id desc limit 1"
    )
    return _assignment(rows[0])


def list_assignments(limit: int = 50) -> list[dict]:
    try:
        rows = _q(
            "select id,title,subject,qids,mode,students,due,note,teacher,created "
            "from assignments order by id desc limit ?",
            (limit,),
        )
        return [_assignment(row) for row in rows]
    except RuntimeError:
        return []
