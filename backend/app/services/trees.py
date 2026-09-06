from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status

from app.database import daily_tasks_col, species_col, tasks_col, trees_col
from app.models.serialize import serialize_id
from app.services.friends import are_friends


def _as_object_id(value: str, detail: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc


def serialize_tree(doc: dict) -> dict:
    serialized = serialize_id(doc) or {}
    serialized["userIds"] = [str(user_id) for user_id in doc.get("userIds", [])]
    serialized["speciesId"] = str(doc["speciesId"]) if doc.get("speciesId") else None
    return serialized


def create_tree(current_user: dict, friend_id: str, reference_photo_url: str) -> dict:
    me_id = _as_object_id(current_user["id"], "Invalid user")
    other_id = _as_object_id(friend_id, "Invalid friendId")
    if me_id == other_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Choose a friend")
    if not are_friends(me_id, other_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You must be friends first")

    existing = trees_col().find_one(
        {"userIds": {"$all": [me_id, other_id]}, "status": "growing"}
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have a growing tree")

    species = species_col().find_one()
    if species is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No tree species seeded")

    catalog = list(tasks_col().find())
    if not catalog:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No tasks seeded")

    now = datetime.now(timezone.utc)
    tree = {
        "userIds": [me_id, other_id],
        "speciesId": species["_id"],
        "growth": 0,
        "status": "growing",
        "lastActivityAt": now,
        "createdAt": now,
        "completedAt": None,
        "referencePhotoUrl": reference_photo_url,
    }
    result = trees_col().insert_one(tree)
    tree["_id"] = result.inserted_id

    daily_tasks_col().insert_many(
        [
            {
                "treeId": result.inserted_id,
                "taskId": task["_id"],
                "taskDate": now,
                "completed": False,
            }
            for task in catalog
        ]
    )
    return serialize_tree(tree)


def get_active_tree(current_user: dict) -> dict:
    me_id = _as_object_id(current_user["id"], "Invalid user")
    tree = trees_col().find_one(
        {"userIds": me_id, "status": "growing"},
        sort=[("createdAt", -1)],
    )
    if tree is None:
        tree = trees_col().find_one(
            {"userIds": me_id},
            sort=[("createdAt", -1)],
        )
    if tree is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No tree yet")
    return serialize_tree(tree)


def get_tree(current_user: dict, tree_id: str) -> dict:
    me_id = _as_object_id(current_user["id"], "Invalid user")
    tree = trees_col().find_one({"_id": _as_object_id(tree_id, "Invalid tree id")})
    if tree is None or me_id not in tree.get("userIds", []):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tree not found")
    return serialize_tree(tree)
