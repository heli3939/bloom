# Bloom

Bloom is a shared-growth app: create an account, then grow a tree with a friend
by completing daily tasks.

- Frontend: React 19 and Vite
- Backend: FastAPI and Uvicorn
- Database: MongoDB Atlas (or local MongoDB) via PyMongo

## Project structure

```text
bloom/
├── frontend/          React app and login pages
├── backend/app/       FastAPI application
├── docs/              Design and API notes
└── README.md
```

## Prerequisites

- Python 3.12
- Node.js 20.19+ or 22.12+
- A MongoDB database (Atlas is fine). The app stores users, friends, trees, and tasks there.

## Local setup

Clone the repo and use this branch:

```bash
git clone https://github.com/heli3939/bloom.git
cd bloom
git checkout login-to-tree
```

### Backend

**macOS / Linux**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

**Windows (PowerShell)**

```powershell
Set-Location backend
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` before starting the API:

```env
FRONTEND_ORIGINS=http://localhost:5173
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=Bloom
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRE_MINUTES=10080
```

Notes:

- `FRONTEND_ORIGINS` must be exactly `http://localhost:5173` with **no trailing slash**.
- `MONGODB_DATABASE` is case-sensitive. Compass collections live in `Bloom`.
- Do not put the Mongo URI in any frontend env file.
- Never commit `.env`.

Start the API from `backend` with the venv active:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API is at <http://127.0.0.1:8000>. Docs are at <http://127.0.0.1:8000/docs>.
`GET /api/health` should return `"status": "ok"` once Mongo is reachable.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A `frontend/.env` is optional. Leave `VITE_API_URL` empty so Vite proxies `/api` to the backend.

The app is at <http://localhost:5173>. Open the login page first:

- Sign in: <http://localhost:5173/auth/login.html>
- Create account: <http://localhost:5173/auth/create-account.html>

Passwords must be at least 8 characters. After login or signup you are sent to the garden at `/`.

To try the tree UI without Mongo or an account:

```bash
cd frontend
npm run dev:demo
```

## Useful commands

```bash
(cd frontend && npm run lint && npm run build)
(cd backend && python -m compileall app)
```

## AI usage

This project used OpenAI Codex to scaffold the FastAPI/React monorepo, add local
development configuration, and verify the starter build. Cursor was used to
connect login, MongoDB user storage, and the tree/task flow.
