from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.database import Database

from app.database import get_database
from app.schemas.tasks import DailyTaskResponse
from app.schemas.trees import TreeCreate, TreeResponse
from app.services.bloom import (
    BloomError,
    create_tree,
    get_completed_trees,
    get_or_create_daily_tasks,
    get_tree,
)

router = APIRouter(prefix="/trees", tags=["trees"])


def raise_http(error: BloomError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.detail)


@router.post("", response_model=TreeResponse, status_code=201)
def create_tree_route(payload: TreeCreate, db: Database = Depends(get_database)):
    try:
        return create_tree(db, payload.model_dump(by_alias=True))
    except BloomError as error:
        raise_http(error)


@router.get("", response_model=List[TreeResponse])
def completed_trees_route(
    user_id: str = Query(alias="userId"),
    friend_id: str = Query(alias="friendId"),
    db: Database = Depends(get_database),
):
    try:
        return get_completed_trees(db, user_id, friend_id)
    except BloomError as error:
        raise_http(error)


@router.get("/{tree_id}", response_model=TreeResponse)
def get_tree_route(tree_id: str, db: Database = Depends(get_database)):
    try:
        return get_tree(db, tree_id)
    except BloomError as error:
        raise_http(error)


@router.get("/{tree_id}/daily-tasks", response_model=List[DailyTaskResponse])
def daily_tasks_route(
    tree_id: str,
    task_date: Optional[str] = Query(default=None, alias="date"),
    db: Database = Depends(get_database),
):
    try:
        selected_date = date.fromisoformat(task_date) if task_date else date.today()
        return get_or_create_daily_tasks(db, tree_id, selected_date)
    except ValueError:
        raise HTTPException(status_code=422, detail="date must use YYYY-MM-DD format")
    except BloomError as error:
        raise_http(error)
