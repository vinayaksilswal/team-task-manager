import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes.auth import router as auth_router
from app.routes.projects import router as projects_router
from app.routes.tasks import router as tasks_router
from app.routes.users import router as users_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup (convenient for quick running/Railway)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Clean up connection pool on shutdown
    await engine.dispose()

app = FastAPI(
    title="Team Task Manager API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS — read from CORS_ORIGINS env var (comma-separated) or fall
# back to permissive defaults that work both locally and on Railway.
_env_origins = os.getenv("CORS_ORIGINS", "")
origins: list[str] = (
    [o.strip() for o in _env_origins.split(",") if o.strip()]
    if _env_origins
    else [
        "*",                        # Allow any origin (safe for public APIs)
        "http://localhost:5173",     # Local Vite dev server
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(users_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Welcome to the Team Task Manager API. Access /docs for API documentation."
    }
