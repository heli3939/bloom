from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.config import get_settings
from app.database import get_database
from app.services.catalog import seed_demo_users

router = APIRouter(prefix="/dev", tags=["development"])


@router.post("/bootstrap")
def bootstrap_demo(db: Database = Depends(get_database)):
    if get_settings().app_env != "development":
        raise HTTPException(status_code=404, detail="Not found")

    user_ids = seed_demo_users(db)
    latest_tree = db.TREES.find_one(
        {"userIds": {"$all": user_ids}}, sort=[("createdAt", -1)]
    )
    species = db.TREE_SPECIES.find_one({"name": "Demo Tree"})
    return {
        "currentUserId": str(user_ids[0]),
        "friendUserId": str(user_ids[1]),
        "speciesId": str(species["_id"]),
        "activeTreeId": str(latest_tree["_id"]) if latest_tree else None,
    }
