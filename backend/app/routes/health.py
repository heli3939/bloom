from fastapi import APIRouter, HTTPException, status
from pymongo.errors import PyMongoError

from app.config import get_settings
from app.database import get_mongo_client
from app.schemas.health import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", response_model=HealthResponse)
def health_check() -> HealthResponse:
    settings = get_settings()
    try:
        get_mongo_client().admin.command("ping")
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc
    return HealthResponse(status="ok", service=settings.app_name, environment=settings.app_env)
