# Database Documentation: SQLite & SQLModel

Welcome! If you are new to databases and SQL, this guide explains how our backend stores data, why we chose these tools, and how each component works.

---

## 1. What is SQLite?

A database is like a collection of spreadsheets where you store information reliably.

* **Traditional Databases** (like PostgreSQL or MySQL): Run as separate server software, require configuration, user credentials, and network communication.
* **SQLite**: A **file-based** database engine. The entire database is stored inside a single file on your disk (for example, `app.db`).
  - **Zero Configuration**: No installation or server startup required.
  - **Embedded**: The Python process itself reads and writes the `.db` file directly.
  - **Lightweight & Free**: Perfect for development, testing, local prototypes, and zero-cost projects.

---

## 2. What is SQLModel?

Writing raw SQL queries by hand (like `SELECT * FROM exams WHERE id = 1;`) can be error-prone and tedious.

**SQLModel** is an Object-Relational Mapper (ORM) designed by the creator of FastAPI. It bridges Python objects and SQL tables:
* It combines **Pydantic** (data validation and typing) with **SQLAlchemy** (Python's leading SQL toolkit).
* You write standard Python classes (`class Exam(SQLModel, table=True)`), and SQLModel automatically:
  1. Creates the matching database tables.
  2. Translates Python queries into SQL queries.
  3. Validates inputs and serializes outputs.

---

## 3. What are Tables, Rows, and Columns?

* **Table**: A structured list representing one type of entity (e.g., `Teacher`, `Exam`, `Submission`).
* **Column (Field)**: An attribute of that entity (e.g., `id`, `title`, `created_at`).
* **Row (Record)**: A single item in that table (e.g., Exam with ID 1, title "CS101 Midterm").

*(Note: Currently in the initial setup, no application tables are created yet. Tables will be added in upcoming milestones: `Teacher`, `Exam`, `Question`, `Submission`, and `Answer`.)*

---

## 4. How `app/db.py` Works

Here is a breakdown of our database module:

```python
from sqlmodel import SQLModel, create_engine, Session, text
from app.config import settings
```

1. **`create_engine`**:
   The engine manages the connection pool to the SQLite file (`app.db`).
   - We set `connect_args={"check_same_thread": False}` because FastAPI handles requests across multiple threads, and SQLite by default restricts access to the thread that opened it.
2. **`init_db()`**:
   - Calls `SQLModel.metadata.create_all(engine)`.
   - On server startup, it inspects all defined SQLModel table classes and creates any missing tables in the SQLite file.
3. **`check_db_connection()`**:
   - Opens a database session and executes a lightweight query (`SELECT 1`).
   - Used by the `/api/health` endpoint to verify that the database file is accessible and responding.

---

## 5. Table Registry

| Table Name | Description | Key Columns | Status |
|------------|-------------|-------------|--------|
| `Teacher` | Stores seeded teacher credentials for login authentication. | `id` (PK), `username` (unique), `password_hash` | Active (Day 1 Auth) |
| `Exam` | Exam definitions and subjects | Pending | Next |
| `Question` | Questions with reference answers & criteria | Pending | Next |
| `Submission` | Student submissions | Pending | Day 2 |
| `Answer` | Question-level answers and OCR text | Pending | Day 2 |

*This document will be updated whenever a new table is introduced.*

