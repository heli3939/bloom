from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.schemas.tasks import DailyTaskResponse
from app.schemas.trees import CreateTreeRequest, TreeResponse
from app.services.tasks import list_daily_tasks
from app.services.trees import create_tree, get_active_tree, get_tree

router = APIRouter(prefix="/trees", tags=["trees"])


@router.post("", response_model=TreeResponse)
def create_shared_tree(
    body: CreateTreeRequest,
    current_user: dict = Depends(get_current_user),
) -> TreeResponse:
    return TreeResponse(**create_tree(current_user, body.friendId, body.referencePhotoUrl))


@router.get("/active", response_model=TreeResponse)
def read_active_tree(current_user: dict = Depends(get_current_user)) -> TreeResponse:
    return TreeResponse(**get_active_tree(current_user))


@router.get("/{tree_id}/daily-tasks", response_model=list[DailyTaskResponse])
def read_tree_daily_tasks(
    tree_id: str,
    current_user: dict = Depends(get_current_user),
) -> list[DailyTaskResponse]:
    return [DailyTaskResponse(**task) for task in list_daily_tasks(current_user, tree_id)]


@router.get("/{tree_id}", response_model=TreeResponse)
def read_tree(tree_id: str, current_user: dict = Depends(get_current_user)) -> TreeResponse:
    return TreeResponse(**get_tree(current_user, tree_id))
