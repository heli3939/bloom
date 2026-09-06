from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.database import completions_col, daily_tasks_col, tasks_col, trees_col
from app.models.serialize import serialize_id


def next_growth(current: int, value: int) -> int:
    return min(100, current + value)


def _as_object_id(value: str, detail: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc


def list_catalog() -> list[dict]:
    return [serialize_id(task) or {} for task in tasks_col().find()]


def list_daily_tasks(current_user: dict, tree_id: str) -> list[dict]:
    me_id = _as_object_id(current_user["id"], "Invalid user")
    tree_oid = _as_object_id(tree_id, "Invalid tree id")
    tree = trees_col().find_one({"_id": tree_oid})
    if tree is None or me_id not in tree.get("userIds", []):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tree not found")

    member_ids = [str(user_id) for user_id in tree.get("userIds", [])]
    daily_tasks = list(daily_tasks_col().find({"treeId": tree_oid}))
    catalog = {task["_id"]: task for task in tasks_col().find()}
    completions = list(completions_col().find({"treeId": tree_oid}))
    completions_by_daily = {}
    for completion in completions:
        completions_by_daily.setdefault(str(completion["dailyTaskId"]), []).append(completion)

    results = []
    for daily in daily_tasks:
        task = catalog.get(daily["taskId"], {})
        daily_completions = completions_by_daily.get(str(daily["_id"]), [])
        completion_map = {str(item["userId"]): item for item in daily_completions}
        results.append(
            {
                "id": str(daily["_id"]),
                "treeId": str(daily["treeId"]),
                "taskId": str(daily["taskId"]),
                "title": task.get("title", ""),
                "description": task.get("description", ""),
                "category": task.get("category", ""),
                "growthValue": task.get("growthValue", 0),
                "completed": bool(daily.get("completed")),
                "completions": [
                    {
                        "userId": member_id,
                        "photoUrl": completion_map[member_id]["photoUrl"]
                        if member_id in completion_map
                        else None,
                    }
                    for member_id in member_ids
                ],
            }
        )
    return results


def complete_daily_task(current_user: dict, daily_task_id: str, photo_url: str) -> dict:
    me_id = _as_object_id(current_user["id"], "Invalid user")
    daily_oid = _as_object_id(daily_task_id, "Invalid daily task id")
    daily = daily_tasks_col().find_one({"_id": daily_oid})
    if daily is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily task not found")

    tree = trees_col().find_one({"_id": daily["treeId"]})
    if tree is None or me_id not in tree.get("userIds", []):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tree not found")

    now = datetime.now(timezone.utc)
    try:
        completions_col().insert_one(
            {
                "dailyTaskId": daily_oid,
                "treeId": daily["treeId"],
                "userId": me_id,
                "completedAt": now,
                "photoUrl": photo_url,
            }
        )
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already submitted this task",
        ) from exc

    completion_count = completions_col().count_documents({"dailyTaskId": daily_oid})
    if completion_count >= 2 and not daily.get("completed"):
        task = tasks_col().find_one({"_id": daily["taskId"]}) or {}
        growth = next_growth(int(tree.get("growth", 0)), int(task.get("growthValue", 0)))
        update = {
            "growth": growth,
            "lastActivityAt": now,
        }
        if growth >= 100:
            update["status"] = "completed"
            update["completedAt"] = now
        trees_col().update_one({"_id": tree["_id"]}, {"$set": update})
        daily_tasks_col().update_one({"_id": daily_oid}, {"$set": {"completed": True}})

    return {"dailyTasks": list_daily_tasks(current_user, str(daily["treeId"]))}
