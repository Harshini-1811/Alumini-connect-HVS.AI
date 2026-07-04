"""
AlumniConnect + HVS.Ai — FastAPI Backend
Database: SQLite (alumniconnect.db) — Python built-in sqlite3
✅ Credentials and ALL data persist permanently across server restarts
✅ No extra installs needed — only fastapi, uvicorn, pydantic

9 Tables:
  users          — student & alumni accounts (credentials stored here)
  skills         — skills per user
  requests       — connection requests
  connections    — accepted connection pairs
  messages       — chat messages
  jobs           — job postings
  events         — community events
  forum_posts    — forum discussions
  quiz_attempts  — quiz history & earned points
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import hashlib, time, random, string, re, sqlite3, os, json
from contextlib import contextmanager

app = FastAPI(title="AlumniConnect API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════════════════════
# DATABASE  —  SQLite (alumniconnect.db lives next to main.py)
# ═══════════════════════════════════════════════════════════════════════════════

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "alumniconnect.db")

@contextmanager
def get_db():
    """Open connection → commit on success → rollback on error → always close."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row           # rows behave like dicts
    conn.execute("PRAGMA journal_mode=WAL")  # better concurrent read/write
    conn.execute("PRAGMA foreign_keys=ON")   # enforce FK constraints
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Create all tables + indexes on very first run. Safe to call every startup."""
    with get_db() as conn:
        conn.executescript("""
        -- ── USERS (credentials live here — persist forever) ──────────────────
        CREATE TABLE IF NOT EXISTS users (
            uid             TEXT PRIMARY KEY,
            email           TEXT UNIQUE NOT NULL,
            name            TEXT NOT NULL,
            role            TEXT NOT NULL CHECK(role IN ('student','alumni')),
            college         TEXT NOT NULL,
            college_norm    TEXT NOT NULL,
            password_hash   TEXT NOT NULL,
            bio             TEXT    DEFAULT '',
            degree          TEXT    DEFAULT '',
            grad_year       TEXT    DEFAULT '',
            major           TEXT    DEFAULT '',
            current_company TEXT    DEFAULT '',
            current_role    TEXT    DEFAULT '',
            experience      TEXT    DEFAULT '',
            linkedin        TEXT    DEFAULT '',
            github          TEXT    DEFAULT '',
            interests       TEXT    DEFAULT '',
            pts             INTEGER DEFAULT 0,
            created_at      INTEGER NOT NULL
        );

        -- ── SKILLS ───────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS skills (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id  TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            name     TEXT NOT NULL,
            endorsed INTEGER DEFAULT 0,
            UNIQUE(user_id, name COLLATE NOCASE)
        );

        -- ── CONNECTION REQUESTS ──────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS requests (
            id         TEXT PRIMARY KEY,
            from_uid   TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            to_uid     TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            status     TEXT NOT NULL DEFAULT 'pending'
                           CHECK(status IN ('pending','accepted','declined')),
            created_at TEXT NOT NULL,
            UNIQUE(from_uid, to_uid)
        );

        -- ── ACCEPTED CONNECTIONS ─────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS connections (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            uid_a TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            uid_b TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            UNIQUE(uid_a, uid_b)
        );

        -- ── MESSAGES ─────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS messages (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            from_uid TEXT    NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            to_uid   TEXT    NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            text     TEXT    NOT NULL,
            sent_at  INTEGER NOT NULL
        );

        -- ── JOBS ─────────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS jobs (
            id         TEXT PRIMARY KEY,
            posted_by  TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            title      TEXT NOT NULL,
            company    TEXT NOT NULL,
            job_type   TEXT DEFAULT 'Full-time',
            salary     TEXT DEFAULT '',
            location   TEXT DEFAULT '',
            created_at TEXT NOT NULL
        );

        -- ── EVENTS ───────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS events (
            id          TEXT PRIMARY KEY,
            created_by  TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            title       TEXT NOT NULL,
            event_type  TEXT DEFAULT 'Workshop',
            event_date  TEXT DEFAULT '',
            description TEXT DEFAULT '',
            created_at  TEXT NOT NULL
        );

        -- ── FORUM POSTS ───────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS forum_posts (
            id         TEXT PRIMARY KEY,
            author_id  TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            title      TEXT NOT NULL,
            content    TEXT NOT NULL,
            tags       TEXT    DEFAULT '[]',
            likes      INTEGER DEFAULT 0,
            replies    INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        );

        -- ── QUIZ ATTEMPTS (history + points tracking) ────────────────────────
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    TEXT    NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            score      INTEGER NOT NULL,
            correct    INTEGER NOT NULL,
            total      INTEGER NOT NULL,
            earned_pts INTEGER NOT NULL,
            taken_at   INTEGER NOT NULL
        );

        -- ── INDEXES for query performance ─────────────────────────────────────
        CREATE INDEX IF NOT EXISTS idx_users_college  ON users(college_norm);
        CREATE INDEX IF NOT EXISTS idx_users_role     ON users(role);
        CREATE INDEX IF NOT EXISTS idx_skills_user    ON skills(user_id);
        CREATE INDEX IF NOT EXISTS idx_req_from       ON requests(from_uid);
        CREATE INDEX IF NOT EXISTS idx_req_to         ON requests(to_uid);
        CREATE INDEX IF NOT EXISTS idx_req_status     ON requests(status);
        CREATE INDEX IF NOT EXISTS idx_conn_a         ON connections(uid_a);
        CREATE INDEX IF NOT EXISTS idx_conn_b         ON connections(uid_b);
        CREATE INDEX IF NOT EXISTS idx_msg_pair       ON messages(from_uid, to_uid);
        CREATE INDEX IF NOT EXISTS idx_msg_sent       ON messages(sent_at);
        CREATE INDEX IF NOT EXISTS idx_jobs_type      ON jobs(job_type);
        CREATE INDEX IF NOT EXISTS idx_forum_date     ON forum_posts(created_at);
        CREATE INDEX IF NOT EXISTS idx_quiz_user      ON quiz_attempts(user_id);
        """)
    # Count existing users so we know if this is a fresh DB or existing one
    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
    print(f"[DB] SQLite ready  =>  {DB_PATH}")
    print(f"[DB] {count} existing user(s) loaded from database")

init_db()   # runs every startup — safe, only creates if not exists

# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def rid():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

def hpw(p: str) -> str:
    return hashlib.sha256(p.encode("utf-8")).hexdigest()[:24]

def norm(c: str) -> str:
    return re.sub(r'[^a-z0-9]', '', (c or '').strip().lower())

def valid_email(e: str) -> bool:
    return bool(e and re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', e))

def row_to_user(row) -> dict:
    """Convert DB row → camelCase dict. Never returns password_hash."""
    if row is None:
        return {}
    d = dict(row)
    d.pop("password_hash", None)
    renames = {
        "grad_year":       "gradYear",
        "current_company": "currentCompany",
        "current_role":    "currentRole",
        "created_at":      "createdAt",
        "college_norm":    "collegeNorm",
    }
    for old, new in renames.items():
        if old in d:
            d[new] = d.pop(old)
    return d

def fetch_user(conn, uid: str) -> Optional[dict]:
    row = conn.execute("SELECT * FROM users WHERE uid=?", (uid,)).fetchone()
    return row_to_user(row) if row else None

def fetch_skills(conn, uid: str) -> list:
    rows = conn.execute(
        "SELECT name, endorsed FROM skills WHERE user_id=? ORDER BY id", (uid,)
    ).fetchall()
    return [{"n": r["name"], "e": r["endorsed"]} for r in rows]

def are_connected(conn, a: str, b: str) -> bool:
    return conn.execute(
        "SELECT 1 FROM connections WHERE (uid_a=? AND uid_b=?) OR (uid_a=? AND uid_b=?)",
        (a, b, b, a)
    ).fetchone() is not None

def get_connections_for(conn, uid: str) -> list:
    me = conn.execute("SELECT college_norm FROM users WHERE uid=?", (uid,)).fetchone()
    if not me:
        return []
    my_cn = me["college_norm"]
    rows = conn.execute("""
        SELECT u.* FROM users u
        JOIN connections c ON (c.uid_a=u.uid OR c.uid_b=u.uid)
        WHERE (c.uid_a=? OR c.uid_b=?) AND u.uid!=?
    """, (uid, uid, uid)).fetchall()
    return [row_to_user(r) for r in rows if r["college_norm"] == my_cn]

def calc_match(student: dict, alumni: dict) -> int:
    sc = norm(student.get("college",""))
    ac = norm(alumni.get("college",""))
    score = 0
    if sc and ac:
        if sc == ac: score += 60
        elif len(sc) > 4 and sc[:5] == ac[:5]: score += 30
    interests = (student.get("interests") or student.get("major") or "").lower().split()
    kw = " ".join([alumni.get("currentRole",""), alumni.get("bio",""),
                   " ".join(alumni.get("skills",[]))]).lower()
    score += min(40, sum(8 for w in interests if len(w) > 2 and w in kw))
    return min(100, score)

# ═══════════════════════════════════════════════════════════════════════════════
# PYDANTIC MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class SignupData(BaseModel):
    name: str; email: str; password: str; role: str; college: str
    degree: Optional[str] = ""; gradYear: Optional[str] = ""
    major: Optional[str] = ""; currentCompany: Optional[str] = ""
    currentRole: Optional[str] = ""; experience: Optional[str] = ""

class LoginData(BaseModel):
    email: str; password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None;    bio: Optional[str] = None
    college: Optional[str] = None; degree: Optional[str] = None
    gradYear: Optional[str] = None; major: Optional[str] = None
    interests: Optional[str] = None; currentCompany: Optional[str] = None
    currentRole: Optional[str] = None; experience: Optional[str] = None
    linkedin: Optional[str] = None; github: Optional[str] = None

class SkillData(BaseModel):
    name: str

class ReqData(BaseModel):
    to: str

class MsgData(BaseModel):
    text: str

class JobData(BaseModel):
    title: str; company: str; jobType: str = "Full-time"
    salary: Optional[str] = ""; location: Optional[str] = ""

class EventData(BaseModel):
    title: str; date: Optional[str] = ""
    type: str = "Workshop"; desc: Optional[str] = ""

class PostData(BaseModel):
    title: str; content: str; tags: List[str] = []

class QuizSubmit(BaseModel):
    answers: List[int]

# ═══════════════════════════════════════════════════════════════════════════════
# AUTH  —  credentials saved to SQLite, persist forever
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/signup")
def signup(d: SignupData):
    name    = (d.name    or "").strip()
    email   = (d.email   or "").strip().lower()
    college = (d.college or "").strip()
    pw      = d.password or ""

    if not name:               raise HTTPException(400, "Please enter your full name.")
    if not email:              raise HTTPException(400, "Please enter your email address.")
    if not valid_email(email): raise HTTPException(400, "Please enter a valid email (e.g. name@gmail.com).")
    if not college:            raise HTTPException(400, "Please enter your college / university name.")
    if len(pw) < 6:            raise HTTPException(400, "Password must be at least 6 characters.")
    if d.role not in ("student","alumni"):
        raise HTTPException(400, "Role must be student or alumni.")

    with get_db() as conn:
        if conn.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
            raise HTTPException(400, f"An account already exists for '{email}'. Please sign in instead.")

        conn.execute("""
            INSERT INTO users
              (uid, email, name, role, college, college_norm, password_hash,
               degree, grad_year, major, current_company, current_role,
               experience, interests, pts, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?)
        """, (
            email, email, name, d.role, college, norm(college), hpw(pw),
            (d.degree         or "").strip(),
            (d.gradYear       or "").strip(),
            (d.major          or "").strip(),
            (d.currentCompany or "").strip(),
            (d.currentRole    or "").strip(),
            (d.experience     or "").strip(),
            (d.major          or "").strip(),
            int(time.time()),
        ))
        user = fetch_user(conn, email)

    print(f"[Auth] ✅ New user saved to DB: {name} ({email}) — {d.role} @ {college}")
    return user

@app.post("/api/auth/login")
def login(d: LoginData):
    email = (d.email or "").strip().lower()
    pw    = d.password or ""

    if not email:              raise HTTPException(400, "Please enter your email address.")
    if not valid_email(email): raise HTTPException(400, "Please enter a valid email (e.g. name@gmail.com).")
    if not pw:                 raise HTTPException(400, "Please enter your password.")

    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not row:
            raise HTTPException(401, f"No account found for '{email}'. Please sign up first.")
        if row["password_hash"] != hpw(pw):
            raise HTTPException(401, "Incorrect password. Please try again.")
        user = row_to_user(row)

    print(f"[Auth] Login: {user['name']} ({email})")
    return user

# ═══════════════════════════════════════════════════════════════════════════════
# PROFILE & SKILLS
# ═══════════════════════════════════════════════════════════════════════════════

@app.put("/api/users/{uid}/profile")
def update_profile(uid: str, d: ProfileUpdate):
    col_map = {
        "gradYear":"grad_year",
        "currentCompany":"current_company",
        "currentRole":"current_role",
    }
    updates = d.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(400, "Nothing to update.")
    parts, vals = [], []
    for k, v in updates.items():
        col = col_map.get(k, k)
        parts.append(f"{col}=?")
        vals.append((v or "").strip())
        if k == "college":
            parts.append("college_norm=?")
            vals.append(norm(v or ""))
    vals.append(uid)
    with get_db() as conn:
        conn.execute(f"UPDATE users SET {', '.join(parts)} WHERE uid=?", vals)
        user = fetch_user(conn, uid)
    if not user:
        raise HTTPException(404, "User not found.")
    return user

@app.get("/api/users/{uid}/skills")
def get_skills_route(uid: str):
    with get_db() as conn:
        return fetch_skills(conn, uid)

@app.post("/api/users/{uid}/skills")
def add_skill(uid: str, d: SkillData):
    n = (d.name or "").strip()
    if not n:
        raise HTTPException(400, "Skill name cannot be empty.")
    with get_db() as conn:
        if conn.execute(
            "SELECT 1 FROM skills WHERE user_id=? AND LOWER(name)=LOWER(?)", (uid, n)
        ).fetchone():
            raise HTTPException(400, f"'{n}' is already in your skills.")
        conn.execute("INSERT INTO skills (user_id, name) VALUES (?,?)", (uid, n))
        return fetch_skills(conn, uid)

@app.delete("/api/users/{uid}/skills/{idx}")
def del_skill(uid: str, idx: int):
    with get_db() as conn:
        sk = fetch_skills(conn, uid)
        if 0 <= idx < len(sk):
            conn.execute(
                "DELETE FROM skills WHERE user_id=? AND name=?", (uid, sk[idx]["n"])
            )
        return fetch_skills(conn, uid)

# ═══════════════════════════════════════════════════════════════════════════════
# MENTORS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/users/{uid}/mentors")
def get_mentors(uid: str, q: Optional[str] = None):
    with get_db() as conn:
        student = fetch_user(conn, uid)
        if not student: return []
        sc = norm(student.get("college",""))
        if not sc: return []
        rows = conn.execute(
            "SELECT * FROM users WHERE role='alumni' AND uid!=? AND college_norm=?",
            (uid, sc)
        ).fetchall()
        out = []
        for row in rows:
            al = row_to_user(row)
            al["skills"] = [s["n"] for s in fetch_skills(conn, al["uid"])]
            if q:
                blob = f"{al.get('name','')} {al.get('currentRole','')} {al.get('currentCompany','')} {' '.join(al['skills'])}".lower()
                if q.lower() not in blob: continue
            al["ms"] = calc_match(student, al)
            out.append(al)
        return sorted(out, key=lambda x: x["ms"], reverse=True)

# ═══════════════════════════════════════════════════════════════════════════════
# REQUESTS & CONNECTIONS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/users/{uid}/requests")
def send_request(uid: str, d: ReqData):
    with get_db() as conn:
        fu = fetch_user(conn, uid)
        tu = fetch_user(conn, d.to)
        if not fu: raise HTTPException(404, "Your account not found.")
        if not tu: raise HTTPException(404, "Target user not found.")
        if norm(fu["college"]) != norm(tu["college"]):
            raise HTTPException(400, "You can only connect with alumni from your own college.")
        if conn.execute(
            "SELECT 1 FROM requests WHERE from_uid=? AND to_uid=? AND status='pending'",
            (uid, d.to)
        ).fetchone():
            raise HTTPException(400, "Connection request already sent.")
        if are_connected(conn, uid, d.to):
            raise HTTPException(400, "You are already connected.")
        req_id = rid()
        today  = time.strftime("%d/%m/%Y")
        conn.execute(
            "INSERT INTO requests (id, from_uid, to_uid, status, created_at) VALUES (?,?,?,'pending',?)",
            (req_id, uid, d.to, today)
        )
        return {"id": req_id, "from": uid, "to": d.to, "status": "pending", "date": today}

@app.put("/api/requests/{req_id}/accept")
def accept_request(req_id: str, uid: str):
    with get_db() as conn:
        req = conn.execute("SELECT * FROM requests WHERE id=?", (req_id,)).fetchone()
        if not req: raise HTTPException(404, "Request not found.")
        conn.execute("UPDATE requests SET status='accepted' WHERE id=?", (req_id,))
        if not are_connected(conn, req["from_uid"], uid):
            conn.execute(
                "INSERT OR IGNORE INTO connections (uid_a, uid_b) VALUES (?,?)",
                (req["from_uid"], uid)
            )
        return {"id": req_id, "status": "accepted"}

@app.put("/api/requests/{req_id}/decline")
def decline_request(req_id: str, uid: str):
    with get_db() as conn:
        conn.execute(
            "UPDATE requests SET status='declined' WHERE id=? AND to_uid=?", (req_id, uid)
        )
    return {"ok": True}

@app.delete("/api/requests/{req_id}")
def cancel_request(req_id: str, uid: str):
    with get_db() as conn:
        conn.execute("DELETE FROM requests WHERE id=? AND from_uid=?", (req_id, uid))
    return {"ok": True}

@app.get("/api/users/{uid}/connections")
def get_connections(uid: str):
    with get_db() as conn:
        return get_connections_for(conn, uid)

@app.get("/api/users/{uid}/inbox")
def get_inbox(uid: str):
    with get_db() as conn:
        me = conn.execute("SELECT college_norm FROM users WHERE uid=?", (uid,)).fetchone()
        if not me: return []
        my_cn = me["college_norm"]
        rows = conn.execute("""
            SELECT r.id, r.from_uid, r.to_uid, r.status, r.created_at,
                   u.name AS sname, u.college AS scollege,
                   u.college_norm AS scn, u.current_role AS srole
            FROM requests r JOIN users u ON u.uid=r.from_uid
            WHERE r.to_uid=? ORDER BY r.created_at DESC
        """, (uid,)).fetchall()
        return [
            {"id": r["id"], "from": r["from_uid"], "to": r["to_uid"],
             "status": r["status"], "date": r["created_at"],
             "fromUser": {"uid": r["from_uid"], "name": r["sname"],
                          "college": r["scollege"], "currentRole": r["srole"] or ""}}
            for r in rows if r["scn"] == my_cn
        ]

@app.get("/api/users/{uid}/sent")
def get_sent(uid: str):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT r.id, r.from_uid, r.to_uid, r.status, r.created_at,
                   u.name AS tname, u.current_role AS trole
            FROM requests r JOIN users u ON u.uid=r.to_uid
            WHERE r.from_uid=? ORDER BY r.created_at DESC
        """, (uid,)).fetchall()
        return [{"id": r["id"], "from": r["from_uid"], "to": r["to_uid"],
                 "status": r["status"], "date": r["created_at"],
                 "toUser": {"uid": r["to_uid"], "name": r["tname"],
                            "currentRole": r["trole"] or ""}} for r in rows]

# ═══════════════════════════════════════════════════════════════════════════════
# MESSAGES
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/messages/{uid_a}/{uid_b}")
def get_messages(uid_a: str, uid_b: str):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT from_uid, text, sent_at FROM messages
            WHERE (from_uid=? AND to_uid=?) OR (from_uid=? AND to_uid=?)
            ORDER BY sent_at ASC
        """, (uid_a, uid_b, uid_b, uid_a)).fetchall()
        return [{"from": r["from_uid"], "text": r["text"], "ts": r["sent_at"]} for r in rows]

@app.post("/api/messages/{from_uid}/{to_uid}")
def send_message(from_uid: str, to_uid: str, d: MsgData):
    with get_db() as conn:
        fu = fetch_user(conn, from_uid)
        tu = fetch_user(conn, to_uid)
        if not fu or not tu: raise HTTPException(404, "User not found.")
        if norm(fu["college"]) != norm(tu["college"]):
            raise HTTPException(400, "You can only message same-college connections.")
        text = (d.text or "").strip()
        if not text: raise HTTPException(400, "Message cannot be empty.")
        ts = int(time.time() * 1000)
        conn.execute(
            "INSERT INTO messages (from_uid, to_uid, text, sent_at) VALUES (?,?,?,?)",
            (from_uid, to_uid, text, ts)
        )
        return {"from": from_uid, "text": text, "ts": ts}

# ═══════════════════════════════════════════════════════════════════════════════
# JOBS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/jobs")
def get_jobs(q: Optional[str] = None, type: Optional[str] = None):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT j.*, u.name AS by_name FROM jobs j
            JOIN users u ON u.uid=j.posted_by
            ORDER BY j.created_at DESC
        """).fetchall()
        out = []
        for r in rows:
            if q and q.lower() not in f"{r['title']} {r['company']}".lower(): continue
            if type and type != "All" and r["job_type"] != type: continue
            out.append({"id": r["id"], "title": r["title"], "company": r["company"],
                        "jobType": r["job_type"], "salary": r["salary"] or "",
                        "location": r["location"] or "", "date": r["created_at"],
                        "by": r["posted_by"], "byName": r["by_name"]})
        return out

@app.post("/api/jobs")
def post_job(uid: str, d: JobData):
    if not d.title.strip():   raise HTTPException(400, "Job title is required.")
    if not d.company.strip(): raise HTTPException(400, "Company name is required.")
    with get_db() as conn:
        jid = rid(); today = time.strftime("%d/%m/%Y")
        conn.execute(
            "INSERT INTO jobs (id, posted_by, title, company, job_type, salary, location, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (jid, uid, d.title.strip(), d.company.strip(), d.jobType, d.salary or "", d.location or "", today)
        )
        return {"id": jid, "title": d.title, "company": d.company,
                "jobType": d.jobType, "salary": d.salary, "location": d.location,
                "date": today, "by": uid}

# ═══════════════════════════════════════════════════════════════════════════════
# EVENTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/events")
def get_events():
    with get_db() as conn:
        rows = conn.execute("""
            SELECT e.*, u.name AS by_name FROM events e
            JOIN users u ON u.uid=e.created_by
            ORDER BY e.created_at DESC
        """).fetchall()
        return [{"id": r["id"], "title": r["title"], "type": r["event_type"],
                 "date": r["event_date"], "desc": r["description"],
                 "by": r["created_by"], "byName": r["by_name"]} for r in rows]

@app.post("/api/events")
def create_event(uid: str, d: EventData):
    if not d.title.strip(): raise HTTPException(400, "Event title is required.")
    with get_db() as conn:
        eid = rid(); today = time.strftime("%d/%m/%Y")
        conn.execute(
            "INSERT INTO events (id, created_by, title, event_type, event_date, description, created_at) VALUES (?,?,?,?,?,?,?)",
            (eid, uid, d.title.strip(), d.type, d.date or "", d.desc or "", today)
        )
        return {"id": eid, "title": d.title, "type": d.type,
                "date": d.date, "desc": d.desc, "by": uid}

# ═══════════════════════════════════════════════════════════════════════════════
# FORUM
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/forum")
def get_forum():
    with get_db() as conn:
        rows = conn.execute("""
            SELECT f.*, u.name AS author_name FROM forum_posts f
            JOIN users u ON u.uid=f.author_id
            ORDER BY f.created_at DESC
        """).fetchall()
        return [{"id": r["id"], "title": r["title"], "content": r["content"],
                 "tags": json.loads(r["tags"] or "[]"),
                 "likes": r["likes"], "replies": r["replies"],
                 "by": r["author_id"], "byName": r["author_name"],
                 "date": r["created_at"]} for r in rows]

@app.post("/api/forum")
def create_post(uid: str, d: PostData):
    if not d.title.strip():   raise HTTPException(400, "Post title is required.")
    if not d.content.strip(): raise HTTPException(400, "Post content is required.")
    with get_db() as conn:
        pid = rid(); today = time.strftime("%d/%m/%Y")
        conn.execute(
            "INSERT INTO forum_posts (id, author_id, title, content, tags, created_at) VALUES (?,?,?,?,?,?)",
            (pid, uid, d.title.strip(), d.content.strip(), json.dumps(d.tags), today)
        )
        u = fetch_user(conn, uid)
        return {"id": pid, "title": d.title, "content": d.content, "tags": d.tags,
                "likes": 0, "replies": 0, "by": uid,
                "byName": u.get("name","?") if u else "?", "date": today}

@app.post("/api/forum/{post_id}/like")
def like_post(post_id: str):
    with get_db() as conn:
        conn.execute("UPDATE forum_posts SET likes=likes+1 WHERE id=?", (post_id,))
    return {"ok": True}

# ═══════════════════════════════════════════════════════════════════════════════
# QUIZ
# ═══════════════════════════════════════════════════════════════════════════════

QUIZ_ANS = [0, 2, 1, 2, 3, 1, 1, 2, 1, 1]

@app.post("/api/quiz/{uid}")
def submit_quiz(uid: str, d: QuizSubmit):
    with get_db() as conn:
        row = conn.execute("SELECT pts FROM users WHERE uid=?", (uid,)).fetchone()
        if not row: raise HTTPException(404, "User not found.")
        correct = sum(
            1 for i, a in enumerate(d.answers)
            if i < len(QUIZ_ANS) and a == QUIZ_ANS[i]
        )
        score   = round(correct / len(QUIZ_ANS) * 100)
        earn    = 30 if score > 75 else (20 if score == 75 else (10 if score >= 50 else 0))
        new_pts = (row["pts"] or 0) + earn
        conn.execute("UPDATE users SET pts=? WHERE uid=?", (new_pts, uid))
        conn.execute(
            "INSERT INTO quiz_attempts (user_id, score, correct, total, earned_pts, taken_at) VALUES (?,?,?,?,?,?)",
            (uid, score, correct, len(QUIZ_ANS), earn, int(time.time()))
        )
        return {"score": score, "correct": correct, "total": len(QUIZ_ANS),
                "earned": earn, "pts": new_pts}

# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/dashboard/{uid}")
def get_dashboard(uid: str):
    with get_db() as conn:
        student = fetch_user(conn, uid)
        if not student: raise HTTPException(404, "User not found.")
        sc    = norm(student.get("college",""))
        conns = get_connections_for(conn, uid)
        pending = conn.execute(
            "SELECT COUNT(*) AS c FROM requests WHERE from_uid=? AND status='pending'", (uid,)
        ).fetchone()["c"]
        skill_count = conn.execute(
            "SELECT COUNT(*) AS c FROM skills WHERE user_id=?", (uid,)
        ).fetchone()["c"]
        recs = []
        if sc:
            rows = conn.execute(
                "SELECT * FROM users WHERE role='alumni' AND uid!=? AND college_norm=?", (uid, sc)
            ).fetchall()
            for r in rows:
                al = row_to_user(r)
                al["skills"] = [s["n"] for s in fetch_skills(conn, al["uid"])]
                al["ms"] = calc_match(student, al)
                recs.append(al)
            recs.sort(key=lambda x: x["ms"], reverse=True)
        ev_rows = conn.execute("""
            SELECT e.id, e.title, e.event_type, e.event_date, u.name AS by_name
            FROM events e JOIN users u ON u.uid=e.created_by
            ORDER BY e.created_at DESC LIMIT 3
        """).fetchall()
        events = [{"id": r["id"], "title": r["title"], "type": r["event_type"],
                   "date": r["event_date"], "byName": r["by_name"]} for r in ev_rows]
        return {"conns": len(conns), "pending": pending, "skills": skill_count,
                "topM": recs[0]["ms"] if recs else 0, "recs": recs[:4], "events": events}

# ═══════════════════════════════════════════════════════════════════════════════
# DEBUG / ADMIN
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/debug/users")
def list_users():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT email, name, role, college, pts FROM users ORDER BY created_at"
        ).fetchall()
        return {"count": len(rows), "users": [dict(r) for r in rows]}

@app.get("/api/debug/stats")
def db_stats():
    tables = ["users","skills","requests","connections",
              "messages","jobs","events","forum_posts","quiz_attempts"]
    with get_db() as conn:
        return {t: conn.execute(f"SELECT COUNT(*) AS c FROM {t}").fetchone()["c"]
                for t in tables}

@app.delete("/api/debug/clear")
def clear_all():
    """DEV ONLY — wipes every row."""
    tables = ["quiz_attempts","messages","skills","requests",
              "connections","jobs","events","forum_posts","users"]
    with get_db() as conn:
        for t in tables:
            conn.execute(f"DELETE FROM {t}")
    return {"ok": True, "message": "All data cleared."}

@app.get("/")
def root():
    with get_db() as conn:
        users = conn.execute("SELECT COUNT(*) AS c FROM users").fetchone()["c"]
        msgs  = conn.execute("SELECT COUNT(*) AS c FROM messages").fetchone()["c"]
    return {
        "status":   "AlumniConnect API running ✅",
        "database": "SQLite — alumniconnect.db",
        "db_path":  DB_PATH,
        "users":    users,
        "messages": msgs,
        "note":     "All credentials persist forever across restarts",
        "docs":     "/docs",
    }
