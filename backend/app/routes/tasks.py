from fastapi import APIRouter

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/")
def tasks_root() -> dict[str, str]:
    return {"message": "Task routes are ready"}
