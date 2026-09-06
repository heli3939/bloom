# Bloom Models, Auth, and API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist Bloom users, friendships, shared trees, and daily task completions in MongoDB Atlas using the Compass schema, behind a JWT-authenticated FastAPI, then point the existing React UI at those APIs.

**Architecture:** Keep PyMongo (already in the project). Each Compass collection gets a small document helper plus Pydantic request/response schemas. Routes stay thin; services own queries and growth rules. Photos stay as URL strings (`photoUrl` / `referencePhotoUrl` / `profileImage`) — for the hackathon, store data URLs from the existing FileReader flow or public HTTPS URLs, not a separate file-hosting service.

**Tech Stack:** FastAPI, PyMongo, Pydantic v2, passlib[bcrypt], python-jose, React 19, Vite. Host frontend on Netlify and backend on Render (or Railway) only after the APIs work locally.

## Global Constraints

- Stay on branch `Tree-n-tasks` until a task is ready to merge.
- Do not commit `.env`, Atlas URIs, JWT secrets, or passwords.
- Collection names match Compass: `USERS`, `FRIENDS`, `TREES`, `TREE_SPECIES`, `TASKS`, `DAILY_TASKS`, `TASK_COMPLETIONS`.
- Set `MONGODB_DATABASE` to the Compass database name (`Bloom` if the export namespace is `Bloom.USERS`).
- Never return `passwordHash` from any endpoint.
- A tree is shared by exactly two `userIds` (the authenticated user and their friend).
- A daily task is complete only when **both** tree members have a `TASK_COMPLETIONS` row; then add `TASKS.growthValue` to `TREES.growth` (cap at 100) and set `DAILY_TASKS.completed` to true.
- Tree `status` is `growing` until `growth >= 100`, then `completed` with `completedAt` set.
- Existing frontend mock behavior in `frontend/src/hooks/useDailyTasks.js` is the source of truth for growth rules; replace in-memory state with API calls last.

---

## Data model (from `Bloom (3).json`)

```text
USERS 1──* FRIENDS *──1 USERS
USERS *──* TREES (via userIds[])
TREE_SPECIES 1──* TREES
TREES 1──* DAILY_TASKS *──1 TASKS
DAILY_TASKS 1──* TASK_COMPLETIONS *──1 USERS
TREES 1──* TASK_COMPLETIONS
```

| Collection | Fields | Notes |
|---|---|---|
| `USERS` | `_id`, `username`, `email`, `passwordHash`, `profileImage`, `createdAt` | Unique `email` and `username` |
| `FRIENDS` | `_id`, `userId`, `friendId`, `createdAt` | Store **two** rows (A→B and B→A) so “my friends” is a single query |
| `TREE_SPECIES` | `_id`, `name`, `description`, `imageUrl` | Seed one default species |
| `TREES` | `_id`, `userIds[]`, `speciesId`, `growth`, `status`, `lastActivityAt`, `createdAt`, `completedAt`, `referencePhotoUrl` | `userIds` length 2 |
| `TASKS` | `_id`, `title`, `description`, `category`, `growthValue` | Catalog; seed from `mockTasks.js` |
| `DAILY_TASKS` | `_id`, `treeId`, `taskId`, `taskDate`, `completed` | One row per task on an active tree (hackathon: assign all catalog tasks when the tree is created) |
| `TASK_COMPLETIONS` | `_id`, `dailyTaskId`, `treeId`, `userId`, `completedAt`, `photoUrl` | Unique `(dailyTaskId, userId)` |

Indexes to create on startup:

- `USERS`: unique `email`, unique `username`
- `FRIENDS`: unique `(userId, friendId)`
- `TREES`: `{ userIds: 1, status: 1 }`
- `DAILY_TASKS`: unique `(treeId, taskId)`
- `TASK_COMPLETIONS`: unique `(dailyTaskId, userId)`

---

## Target file structure

```text
backend/app/
  config.py              # add JWT_SECRET, JWT_EXPIRE_MINUTES
  database.py            # existing client; add ensure_indexes() + collection helpers
  deps.py                # get_current_user from Bearer token
  models/
    __init__.py
    serialize.py         # ObjectId/datetime → JSON
    user.py
    friend.py
    tree.py
    species.py
    task.py
  schemas/
    health.py            # existing
    auth.py
    friends.py
    trees.py
    tasks.py
  services/
    auth.py
    friends.py
    trees.py
    tasks.py
  routes/
    health.py            # ping Mongo
    auth.py              # register, login, me
    friends.py           # list, add
    trees.py             # create, active, get
    tasks.py             # catalog, tree daily tasks, complete
frontend/src/
  services/api.js        # real auth/friends/trees/tasks calls
  hooks/useDailyTasks.js # load/save via API
  pages/Login.jsx        # new
  App.jsx                # simple token gate
```

---

### Task 1: Config, indexes, and collection helpers

**Files:**
- Modify: `backend/app/config.py`
- Modify: `backend/app/database.py`
- Modify: `backend/.env.example`
- Modify: `backend/app/main.py` (call `ensure_indexes()` on startup)
- Create: `backend/app/models/serialize.py`

**Interfaces:**
- Consumes: existing `get_settings()`, `get_database()`
- Produces: `Settings.jwt_secret`, `Settings.jwt_expire_minutes`; `users_col()`, `friends_col()`, `trees_col()`, `species_col()`, `tasks_col()`, `daily_tasks_col()`, `completions_col()`; `ensure_indexes()`; `serialize_id(doc) -> dict`

- [ ] **Step 1: Add JWT settings and example env**

`backend/.env.example`:

```env
APP_NAME=Bloom API
APP_ENV=development
API_PREFIX=/api
FRONTEND_ORIGINS=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=Bloom
JWT_SECRET=change-me
JWT_EXPIRE_MINUTES=10080
```

Add the same `JWT_*` keys to local `backend/.env` (do not commit). Keep the existing Atlas URI. If Compass shows database `Bloom`, set `MONGODB_DATABASE=Bloom`.

Add to `Settings` in `backend/app/config.py`:

```python
jwt_secret: str = os.getenv("JWT_SECRET", "change-me")
jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))
```

- [ ] **Step 2: Collection helpers and indexes**

In `backend/app/database.py` add:

```python
def users_col():
    return get_database()["USERS"]

def friends_col():
    return get_database()["FRIENDS"]

def trees_col():
    return get_database()["TREES"]

def species_col():
    return get_database()["TREE_SPECIES"]

def tasks_col():
    return get_database()["TASKS"]

def daily_tasks_col():
    return get_database()["DAILY_TASKS"]

def completions_col():
    return get_database()["TASK_COMPLETIONS"]


def ensure_indexes() -> None:
    users_col().create_index("email", unique=True)
    users_col().create_index("username", unique=True)
    friends_col().create_index([("userId", 1), ("friendId", 1)], unique=True)
    trees_col().create_index([("userIds", 1), ("status", 1)])
    daily_tasks_col().create_index([("treeId", 1), ("taskId", 1)], unique=True)
    completions_col().create_index([("dailyTaskId", 1), ("userId", 1)], unique=True)
```

Call `ensure_indexes()` at the start of `lifespan` in `backend/app/main.py` before `yield`.

- [ ] **Step 3: Shared serializer**

`backend/app/models/serialize.py` converts `_id` and any `ObjectId` fields to strings and datetimes to ISO strings so FastAPI can return dicts safely.

- [ ] **Step 4: Ping Mongo from health**

Change `GET /api/health` to call `get_mongo_client().admin.command("ping")` and return `status: "ok"` or `503` on failure. Verify at http://127.0.0.1:8000/api/health

- [ ] **Step 5: Commit**

```bash
git add backend/app/config.py backend/app/database.py backend/app/main.py backend/app/models/serialize.py backend/.env.example backend/app/routes/health.py
git commit -m "feat: add Mongo collection helpers, indexes, and JWT settings"
```

---

### Task 2: Auth logic

**Files:**
- Modify: `backend/requirements.txt` (add `passlib[bcrypt]` and `python-jose[cryptography]`)
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/services/auth.py`
- Create: `backend/app/deps.py`
- Modify: `backend/app/routes/auth.py`

**Interfaces:**
- Consumes: `users_col()`, `Settings.jwt_secret`
- Produces: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`; `get_current_user() -> dict` (user doc without `passwordHash`)

- [ ] **Step 1: Install auth libraries**

```text
passlib[bcrypt]
python-jose[cryptography]
```

Run: `backend\venv\Scripts\python.exe -m pip install "passlib[bcrypt]" "python-jose[cryptography]"` then freeze those two lines into `requirements.txt`.

- [ ] **Step 2: Schemas**

```python
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    profileImage: str | None = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

class UserPublic(BaseModel):
    id: str
    username: str
    email: EmailStr
    profileImage: str | None = None
```

- [ ] **Step 3: Service**

- `hash_password` / `verify_password` with passlib bcrypt
- `create_access_token({"sub": str(user_id)})`
- `register`: reject duplicate email/username with 409; insert `USERS` with `createdAt=datetime.utcnow()`
- `login`: 401 if email missing or password mismatch; return JWT
- `user_public(doc)` strips `passwordHash`

- [ ] **Step 4: Routes and dependency**

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
Authorization: Bearer <token>
```

`get_current_user` reads the Bearer token, decodes JWT, loads `USERS` by `_id`, raises 401 if invalid.

- [ ] **Step 5: Manual test**

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"ada\",\"email\":\"ada@example.com\",\"password\":\"secret12\"}"
curl -X POST http://127.0.0.1:8000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"ada@example.com\",\"password\":\"secret12\"}"
curl http://127.0.0.1:8000/api/auth/me -H "Authorization: Bearer TOKEN"
```

Expected: register/login return a token; `me` returns the user without `passwordHash`.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat: add register, login, and JWT auth"
```

---

### Task 3: Friends endpoints

**Files:**
- Create: `backend/app/schemas/friends.py`
- Create: `backend/app/services/friends.py`
- Modify: `backend/app/routes/friends.py`

**Interfaces:**
- Consumes: `get_current_user`, `friends_col()`, `users_col()`
- Produces: `GET /api/friends`, `POST /api/friends` with `{ "username": "..." }`

Rules:

- Cannot friend yourself.
- Lookup friend by `username` (or email).
- Insert two `FRIENDS` documents: `(me, them)` and `(them, me)`.
- Duplicate pair returns 409.
- `GET /api/friends` joins friend user public profiles.

- [ ] **Step 1: Implement service + routes**
- [ ] **Step 2: Test with two registered users, then GET list**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add friend pairing endpoints"
```

---

### Task 4: Seed species and task catalog

**Files:**
- Create: `backend/app/services/seed.py`
- Modify: `backend/app/main.py` to call seed on startup if collections are empty

**Interfaces:**
- Consumes: `species_col()`, `tasks_col()`
- Produces: one `TREE_SPECIES` named `Bloom Tree`; five `TASKS` copied from `frontend/src/data/mockTasks.js` (`title`, `description`, `growthValue`, `category` = `"together"`)

Seed tasks:

| title | growthValue |
|---|---|
| Phone-free hangout | 100 |
| Take a walk together | 10 |
| Share a snack or drink | 5 |
| Find something beautiful together | 5 |
| Share a favourite song | 10 |

- [ ] **Step 1: Idempotent seed (insert only when count is 0)**
- [ ] **Step 2: Confirm in Atlas or `GET /api/tasks` after Task 5**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat: seed tree species and task catalog"
```

---

### Task 5: Trees and daily-task endpoints

**Files:**
- Create: `backend/app/schemas/trees.py`
- Create: `backend/app/schemas/tasks.py`
- Create: `backend/app/services/trees.py`
- Create: `backend/app/services/tasks.py`
- Modify: `backend/app/routes/trees.py`
- Modify: `backend/app/routes/tasks.py`

**Interfaces:**
- Consumes: `get_current_user`, friends, seeded catalog
- Produces:

```http
POST /api/trees                  { "referencePhotoUrl": "...", "friendId": "..." }
GET  /api/trees/active
GET  /api/trees/{tree_id}
GET  /api/tasks
GET  /api/trees/{tree_id}/daily-tasks
POST /api/daily-tasks/{daily_task_id}/complete   { "photoUrl": "..." }
```

Create-tree rules:

1. Caller must already be friends with `friendId`.
2. Reject if the pair already has a tree with `status: "growing"`.
3. Insert `TREES` with `userIds: [me, friend]`, `growth: 0`, `status: "growing"`, `speciesId` = default species, `referencePhotoUrl`, `createdAt`/`lastActivityAt` now, `completedAt: null`.
4. For each catalog `TASKS` row, insert a `DAILY_TASKS` row (`completed: false`, `taskDate` = today).

Complete-task rules (this replaces `useDailyTasks` reducer):

1. Daily task must belong to a tree that includes the current user.
2. Insert `TASK_COMPLETIONS` for `(dailyTaskId, userId)` with `photoUrl`. Second submit by the same user returns 409.
3. Count completions for that `dailyTaskId`. If count == 2:
   - set `DAILY_TASKS.completed = true`
   - add catalog `growthValue` to `TREES.growth`, cap at 100
   - set `lastActivityAt` now
   - if `growth >= 100`: `status = "completed"`, `completedAt` now
4. `GET .../daily-tasks` returns each task with `title`, `growthValue`, `completed`, and each member’s completion (`userId`, `photoUrl` or null).

- [ ] **Step 1: Implement tree create + active + get**
- [ ] **Step 2: Implement catalog + daily list + complete**
- [ ] **Step 3: Manual test with two tokens: both complete one task, confirm `growth` increases only after the second photo**
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: persist shared trees and task completions"
```

---

### Task 6: Wire the React app to the API

**Files:**
- Modify: `frontend/src/services/api.js`
- Create: `frontend/src/pages/Login.jsx` (register + login form)
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/hooks/useDailyTasks.js`
- Modify: `frontend/src/pages/Home.jsx`
- Modify: `frontend/src/components/TaskCard.jsx` (submit `previewUrl` as `photoUrl`; drop simulate-friend button or keep it only in dev)

**Interfaces:**
- Consumes: all endpoints from Tasks 2–5
- Produces: login persists `access_token` in `localStorage`; Home loads active tree + daily tasks; photo submit calls complete endpoint; new tree calls `POST /api/trees`

- [ ] **Step 1: `api.js` helpers** — `authHeader()`, `register`, `login`, `me`, `listFriends`, `addFriend`, `createTree`, `getActiveTree`, `listDailyTasks`, `completeDailyTask`
- [ ] **Step 2: If no token, show Login; else show Home**
- [ ] **Step 3: Replace reducer persistence with fetch on load and after mutations**
- [ ] **Step 4: Browser test:** register two users (two browsers or incognito), add friend, start tree, both upload photos, tree growth updates
- [ ] **Step 5: Commit**

```bash
git commit -m "feat: connect tree UI to authenticated API"
```

---

### Task 7: Deployment (do this last)

**Files:**
- Create: `frontend/netlify.toml`
- Create: `backend/render.yaml` (or a Render dashboard service; file is optional)
- Modify: `frontend/.env.example` to document `VITE_API_URL=https://your-api.onrender.com`

Frontend (Netlify):

- Base directory: `frontend`
- Build: `npm run build`
- Publish: `dist`
- Env: `VITE_API_URL` = public FastAPI URL (no trailing slash)

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "frontend/dist"

[[redirects]]
  from = "/api/*"
  to = "https://YOUR-API.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

If you use the redirect proxy, keep `VITE_API_URL` empty in the Netlify build (same as local Vite proxy). If you call the API host directly, set `VITE_API_URL` and skip the `/api/*` redirect.

Backend (Render Web Service):

- Root directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env: `MONGODB_URI`, `MONGODB_DATABASE=Bloom`, `JWT_SECRET` (long random), `FRONTEND_ORIGINS=https://your-site.netlify.app`, `APP_ENV=production`

Atlas Network Access: allow Render’s outbound IPs or `0.0.0.0/0` for a hackathon.

- [ ] **Step 1: Deploy API, confirm `/api/health` pings Atlas**
- [ ] **Step 2: Deploy frontend, confirm login + tree flow**
- [ ] **Step 3: Commit only config files, never secrets**

```bash
git commit -m "chore: add Netlify and Render deploy config"
```

---

## Suggested order (do not skip ahead)

1. Task 1 — indexes / health ping  
2. Task 2 — auth  
3. Task 3 — friends  
4. Task 4 — seed catalog  
5. Task 5 — trees + completions  
6. Task 6 — React wiring  
7. Task 7 — deploy  

Auth before friends. Friends before trees. Trees before swapping out the mock UI. Deploy only after two real users can grow a tree.

## Out of scope for this plan

- Real object storage (S3/Cloudinary); data URLs are enough for the hackathon photo fields
- Password reset, OAuth, email verification
- Changing the Compass schema
- Push notifications
