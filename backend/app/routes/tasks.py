from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.database import get_database
from app.schemas.tasks import TaskSubmissionCreate, TaskSubmissionResponse
from app.services.bloom import BloomError, submit_daily_task

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post(
    "/daily/{daily_task_id}/submissions",
    response_model=TaskSubmissionResponse,
    status_code=201,
)
def submit_daily_task_route(
    daily_task_id: str,
    payload: TaskSubmissionCreate,
    db: Database = Depends(get_database),
):
    try:
        return submit_daily_task(db, daily_task_id, payload.model_dump(by_alias=True))
    except BloomError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail)
