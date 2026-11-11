from sqlmodel import SQLModel, create_engine, Session, text
from app.config import settings

# For SQLite, check_same_thread=False allows multi-threaded FastAPI requests to share connections safely
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args
)

def init_db() -> None:
    """Creates database engine and all registered tables on application startup."""
    SQLModel.metadata.create_all(engine)

def check_db_connection() -> bool:
    """Performs a trivial SQL query to verify active database connectivity."""
    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1")).one()
        return True
    except Exception:
        return False

