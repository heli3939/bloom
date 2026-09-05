# Bloom

Bloom is a hackathon starter for a React frontend, a FastAPI backend, and MongoDB Atlas.

## Tech stack

- Frontend: React 19 and Vite
- Backend: FastAPI and Uvicorn
- Database: MongoDB via PyMongo
- Suggested frontend hosting: Netlify

## Project structure

```text
bloom/
├── frontend/          React application
├── backend/app/       FastAPI application
├── docs/              Design and API notes
└── README.md
```

## Local setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

The API runs at <http://localhost:8000>. Interactive API documentation is at
<http://localhost:8000/docs>. MongoDB is optional for the health endpoint.

### Frontend

Use Node.js 20.19+ or 22.12+.

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs at <http://localhost:5173> and uses Vite's API proxy.

## Useful commands

```bash
(cd frontend && npm run lint && npm run build)
(cd backend && python -m compileall app)
```

Never commit `.env` files, database URLs, API keys, JWT secrets, or passwords.
Keep `frontend` and `backend` as folders on `main`; use short-lived branches such
as `feature/login` and merge through pull requests.

## Planned features

- Login
- Friend pairing
- Shared tree
- Daily tasks
- Photo upload
- Tree growth

## AI usage

This project used OpenAI Codex to scaffold the FastAPI/React monorepo, add local
development configuration, and verify the starter build. Add further AI use here.
