from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.schemas.tasks import (
    CompleteTaskRequest,
    CompleteTaskResponse,
    TaskCatalogItem,
)
from app.services.tasks import complete_daily_task, list_catalog

router = APIRouter(prefix="/tasks", tags=["tasks"])
daily_router = APIRouter(prefix="/daily-tasks", tags=["tasks"])


@router.get("", response_model=list[TaskCatalogItem])
def read_catalog() -> list[TaskCatalogItem]:
    return [TaskCatalogItem(**task) for task in list_catalog()]


@daily_router.post("/{daily_task_id}/complete", response_model=CompleteTaskResponse)
def complete_task(
    daily_task_id: str,
    body: CompleteTaskRequest,
    current_user: dict = Depends(get_current_user),
) -> CompleteTaskResponse:
    return CompleteTaskResponse(**complete_daily_task(current_user, daily_task_id, body.photoUrl))
