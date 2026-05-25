import os

class Settings:
    PROJECT_NAME: str = "Team Task Manager"
    
    # Read database URL, defaulting to local async SQLite
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./app.db")
    
    # If the URL is for PostgreSQL, ensure it uses the asyncpg driver
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
        
    # JWT authentication settings
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-in-production-1234567890")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours

settings = Settings()
