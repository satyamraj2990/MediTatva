# Mood Analyzer + Distance Tracker ChatBot Setup

## 1) FastAPI Backend

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend endpoints:
- `GET /health`
- `POST /api/chat/query`
- `POST /api/distance/estimate`

## 2) React Helper App

```bash
cd helper
npm install
npm start
```

Optional env for helper app:
- `REACT_APP_BACKEND_URL=http://localhost:8000`

## 3) What is included

- Dashboard rename to **Mood Analyzer** in active patient dashboard text.
- New FastAPI scaffold under `backend/app`.
- New React helper UI under `helper/src` for mood chat + distance estimation.
