from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pymongo.database import Database

from app.config import get_settings
from app.database import get_database

router = APIRouter(prefix="/dev", tags=["development"])

DEMO_TASKS = [
    ("Phone-free hangout", "Spend some uninterrupted time together without your phones.", 10),
    ("Take a walk together", "Go outside and take a short walk together.", 10),
    ("Share a snack or drink", "Choose something simple and enjoy it together.", 5),
    ("Find something beautiful together", "Notice and share something beautiful around you.", 5),
    ("Share a favourite song", "Play a song you love and explain why you chose it.", 10),
]


@router.post("/bootstrap")
def bootstrap_demo(db: Database = Depends(get_database)):
    if get_settings().app_env != "development":
        raise HTTPException(status_code=404, detail="Not found")

    now = datetime.now(timezone.utc)
    user_ids = []
    for username, email in [("Bloom Demo", "demo@bloom.local"), ("Bloom Friend", "friend@bloom.local")]:
        db.USERS.update_one(
            {"email": email},
            {
                "$setOnInsert": {
                    "username": username,
                    "email": email,
                    "passwordHash": "development-only",
                    "profileImage": "",
                    "createdAt": now,
                }
            },
            upsert=True,
        )
        user = db.USERS.find_one({"email": email})
        user_ids.append(user["_id"])

    db.TREE_SPECIES.update_one(
        {"name": "Demo Tree"},
        {
            "$setOnInsert": {
                "name": "Demo Tree",
                "description": "The shared tree used by the development prototype.",
                "imageUrl": "",
            }
        },
        upsert=True,
    )
    species = db.TREE_SPECIES.find_one({"name": "Demo Tree"})

    for title, description, growth_value in DEMO_TASKS:
        db.TASKS.update_one(
            {"title": title},
            {
                "$set": {
                    "description": description,
                    "category": "connection",
                    "growthValue": growth_value,
                },
                "$setOnInsert": {"title": title},
            },
            upsert=True,
        )

    active_tree = db.TREES.find_one(
        {"userIds": {"$all": user_ids}, "status": "active"}, sort=[("createdAt", -1)]
    )
    return {
        "currentUserId": str(user_ids[0]),
        "friendUserId": str(user_ids[1]),
        "speciesId": str(species["_id"]),
        "activeTreeId": str(active_tree["_id"]) if active_tree else None,
    }
