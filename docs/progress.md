Current milestone: Day 1 - Teacher Authentication
Completed:
- Repository structure established (AGENTS.md Section 4)
- Root .gitignore and CLAUDE.md configured
- Backend created with FastAPI, SQLModel, SQLite, Pydantic Settings
- Config.py with .env parsing and CORS support for FRONTEND_ORIGIN
- SQLite engine and init_db() in db.py with connection check
- GET /api/health endpoint verifying live SQLite connectivity
- Teacher database model created in app/models.py
- Password hashing with bcrypt and JWT creation/validation with PyJWT
- Teacher auto-seeding on application startup from .env
- POST /api/auth/login and GET /api/auth/me endpoints in app/routes/auth.py
- Pytest tests for auth (successful login, bad password, token verification) in tests/test_auth.py
- Frontend shared components: Button.jsx and Input.jsx adhering to design tokens
- Frontend Login page (pages/Login.jsx) and authentication flow in App.jsx
- Axios interceptor automatically attaching Bearer token to authenticated requests
- Updated docs/database.md with Teacher table registry
Working:
- Teacher login, JWT issuance, protected routes, and session persistence
Known issues:
- None
Next task:
- Day 1 Exam & Question Management: Exam and Question data models, CRUD routes, and Exam creation screen
Verification:
- Backend pytest: 4 passed in 3.39s (test_auth.py + test_health.py)
- Frontend production build succeeded (`npm run build`)
