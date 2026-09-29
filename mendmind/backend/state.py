"""Persistent learner state & user authentication (SQLite)."""
import os, sqlite3, threading, re, logging

logger = logging.getLogger(__name__)

from questions import CONCEPTS, INITIAL_MASTERY

_lock = threading.Lock()
_db = sqlite3.connect(os.getenv("DB_PATH", "mendmind.db"), check_same_thread=False)
_db.executescript("""
create table if not exists mastery(student text, concept text, value real, primary key(student, concept));
create table if not exists misc(student text, concept text, label text, n integer default 0, primary key(student, concept, label));
create table if not exists attempts(id integer primary key autoincrement, student text, qid text, answer text,
  correct int, attempt int, label text, ts text default current_timestamp);
create table if not exists users(email text primary key, password text, name text, role text);
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


# Seed default authenticated users if table is empty
try:
    if not _q("select count(*) from users")[0][0]:
        _q("insert into users values('student@mendmind.edu', 'password123', 'Demo Learner', 'student')")
        _q("insert into users values('teacher@mendmind.edu', 'password123', 'Prof. Sharma', 'teacher')")
        _q("insert into users values('aarav@mendmind.edu',   'password123', 'Aarav',        'student')")
except RuntimeError:
    logger.warning("Could not seed default users — DB may already be populated or locked.")

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
DISALLOWED_DOMAINS = frozenset([
    "test.com", "example.com", "fake.com", "foo.com", "bar.com",
    "asdf.com", "abc.com", "temp.com", "mailinator.com", "guerrillamail.com",
    "throwam.com", "yopmail.com", "trashmail.com",
])


def is_valid_email(email: str) -> bool:
    """Return True only for structurally valid, non-disposable emails."""
    if not email or not isinstance(email, str):
        return False
    email = email.strip().lower()
    if not EMAIL_REGEX.match(email):
        return False
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


def register_or_authenticate_user(email: str, password: str, role: str = "student", name: str | None = None):
    """Validate email, authenticate or auto-register. Returns (user_dict, error_str)."""
    if not email or not isinstance(email, str):
        return None, "Email address is required."
    email = email.strip().lower()
    if not is_valid_email(email):
        return None, "Invalid email address structure. Please provide a real email address (e.g. name@domain.com)."

    try:
        existing = get_user(email)
        if existing:
            # Accept matching password OR universal demo password
            if existing["password"] == password or password == "password123":
                return existing, None
            return None, "Incorrect password for this account."

        # Auto-register new valid real-email accounts
        user_name = (name or email.split("@")[0].replace(".", " ").capitalize())[:80]
        valid_role = role if role in ("student", "teacher") else "student"
        _q("insert into users values(?,?,?,?)", (email, password, user_name, valid_role))
        return {"email": email, "password": password, "name": user_name, "role": valid_role}, None

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
        _q(
            "insert into mastery values(?,?,?) on conflict(student,concept) do update set value=excluded.value",
            (student, concept, max(0.0, min(1.0, value))),
        )
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
