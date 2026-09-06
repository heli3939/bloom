from bson import ObjectId
from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.database import get_database
from app.deps import get_current_user
from app.services.bloom import expire_inactive_tree
from app.services.catalog import seed_catalog
from app.services.friends import list_friends

router = APIRouter(tags=["session"])


@router.get("/session")
def get_session(
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_database),
) -> dict:
    catalog = seed_catalog(db)
    friends = list_friends(current_user)
    friend_id = friends[0]["id"] if friends else str(catalog["friend"]["_id"])

    me_id = ObjectId(current_user["id"])
    latest_tree = db.TREES.find_one({"userIds": me_id}, sort=[("createdAt", -1)])
    if latest_tree:
        latest_tree = expire_inactive_tree(db, latest_tree)
    active_tree_id = (
        str(latest_tree["_id"])
        if latest_tree and latest_tree.get("status") == "active"
        else None
    )

    return {
        "currentUserId": current_user["id"],
        "friendUserId": friend_id,
        "speciesId": str(catalog["species"]["_id"]),
        "activeTreeId": active_tree_id,
        "user": current_user,
    }
