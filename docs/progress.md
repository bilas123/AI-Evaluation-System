Current milestone: Day 1 - Setup
Completed:
- Repository structure established (AGENTS.md Section 4)
- Root .gitignore and CLAUDE.md configured
- Backend created with FastAPI, SQLModel, SQLite, Pydantic Settings
- Config.py with .env parsing and CORS support for FRONTEND_ORIGIN
- SQLite engine and init_db() in db.py with connection check
- GET /api/health endpoint verifying live SQLite connectivity
- One backend pytest test for /api/health passing
- Frontend created with React, Vite, Tailwind CSS v4, and Axios
- Axios service calling /api/health and rendering "Backend: connected" or "Backend: unreachable"
- docs/database.md explaining SQLite, SQLModel, tables, and db.py for beginners
- README.md with setup, run, and test commands
- backend/.env.example and frontend/.env.example with placeholders
Working:
- Backend and Frontend development servers verified and operational
Known issues:
- None
Next task:
- Day 1 Feature Implementation: Teacher authentication (seeded account + JWT) and Exam creation CRUD
Verification:
- Backend pytest passed (`1 passed in 1.12s`)
- Frontend production build succeeded (`npm run build`)
- Curl verification of GET /api/health: `{"status": "ok", "database": "connected"}` with CORS headers
