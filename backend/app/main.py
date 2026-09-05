from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import close_database_connection
from app.routes import auth, dev, friends, health, tasks, trees

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    close_database_connection()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API for the Bloom shared-growth application.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.frontend_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(friends.router, prefix=settings.api_prefix)
app.include_router(trees.router, prefix=settings.api_prefix)
app.include_router(tasks.router, prefix=settings.api_prefix)
app.include_router(dev.router, prefix=settings.api_prefix)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {"message": "Welcome to the Bloom API", "docs": "/docs"}
