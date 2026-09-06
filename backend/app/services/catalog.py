from datetime import datetime, timezone

from pymongo.database import Database

DEMO_USER_EMAIL = "demo@bloom.local"
DEMO_FRIEND_EMAIL = "friend@bloom.local"
DEMO_SPECIES_NAME = "Demo Tree"

DEMO_TASKS = [
    ("Go for a picnic", "Pack something simple and spend time together outdoors.", 10),
    ("Grab a meal together", "Share breakfast, lunch, or dinner together.", 10),
    ("Visit a new place", "Explore somewhere neither of you has visited before.", 5),
    ("Go for cycling", "Take your bikes out and enjoy a ride together.", 5),
    ("Paint and sip", "Make something colourful while sharing a drink.", 10),
]


def seed_catalog(db: Database) -> dict:
    now = datetime.now(timezone.utc)
    db.USERS.update_one(
        {"email": DEMO_FRIEND_EMAIL},
        {
            "$setOnInsert": {
                "username": "Bloom Friend",
                "email": DEMO_FRIEND_EMAIL,
                "passwordHash": "development-only",
                "profileImage": "",
                "createdAt": now,
            }
        },
        upsert=True,
    )
    friend = db.USERS.find_one({"email": DEMO_FRIEND_EMAIL})

    db.TREE_SPECIES.update_one(
        {"name": DEMO_SPECIES_NAME},
        {
            "$setOnInsert": {
                "name": DEMO_SPECIES_NAME,
                "description": "The shared tree used by the development prototype.",
                "imageUrl": "",
            }
        },
        upsert=True,
    )
    species = db.TREE_SPECIES.find_one({"name": DEMO_SPECIES_NAME})

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

    return {"friend": friend, "species": species}


def seed_demo_users(db: Database) -> list:
    now = datetime.now(timezone.utc)
    user_ids = []
    for username, email in [("Bloom Demo", DEMO_USER_EMAIL), ("Bloom Friend", DEMO_FRIEND_EMAIL)]:
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
    seed_catalog(db)
    return user_ids
