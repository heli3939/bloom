from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.database import friends_col, users_col
from app.services.auth import user_public


def _as_object_id(value: str, detail: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc


def add_friend(current_user: dict, username: str) -> dict:
    query = username.strip()
    if not query:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username is required")

    if "@" in query:
        friend = users_col().find_one({"email": query.lower()})
    else:
        friend = users_col().find_one({"username": query})

    if friend is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    me_id = _as_object_id(current_user["id"], "Invalid user")
    if friend["_id"] == me_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot add yourself")

    now = datetime.now(timezone.utc)
    documents = [
        {"userId": me_id, "friendId": friend["_id"], "createdAt": now},
        {"userId": friend["_id"], "friendId": me_id, "createdAt": now},
    ]
    try:
        friends_col().insert_many(documents, ordered=True)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already friends") from exc

    return user_public(friend)


def list_friends(current_user: dict) -> list[dict]:
    me_id = _as_object_id(current_user["id"], "Invalid user")
    links = list(friends_col().find({"userId": me_id}))
    friend_ids = [link["friendId"] for link in links]
    if not friend_ids:
        return []
    users = users_col().find({"_id": {"$in": friend_ids}})
    return [user_public(user) for user in users]


def are_friends(user_id: ObjectId, friend_id: ObjectId) -> bool:
    return friends_col().find_one({"userId": user_id, "friendId": friend_id}) is not None
