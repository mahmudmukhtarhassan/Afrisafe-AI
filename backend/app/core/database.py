from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import settings

# Connection pooling setup for production
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,         # Adadin bude haɗin gwiwa (connections)
    max_overflow=20,      # Karin hanyoyi idan an samu cunkoso
    pool_pre_ping=True   # Duba haɗin gwiwa kafin amfani don gujewa stale connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    """Base class for SQLAlchemy ORM models"""
    pass

def get_db():
    """
    Dependency generator da ke buɗewa da rufe database session 
    a kowace HTTP request ta hanya amintacciya.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
