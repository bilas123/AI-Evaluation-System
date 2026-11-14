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
    SQLModel.metadata.create_all(engine)

def check_db_connection() -> bool:
    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1")).one()
        return True
    except Exception:
        return False

