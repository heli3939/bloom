from functools import lru_cache

from pymongo import MongoClient, ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database

from app.config import get_settings


@lru_cache
def get_mongo_client() -> MongoClient:
    settings = get_settings()
    return MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)


def get_database() -> Database:
    settings = get_settings()
    return get_mongo_client()[settings.mongodb_database]


def users_col() -> Collection:
    return get_database()["USERS"]


def friends_col() -> Collection:
    return get_database()["FRIENDS"]


def trees_col() -> Collection:
    return get_database()["TREES"]


def species_col() -> Collection:
    return get_database()["TREE_SPECIES"]


def tasks_col() -> Collection:
    return get_database()["TASKS"]


def daily_tasks_col() -> Collection:
    return get_database()["DAILY_TASKS"]


def completions_col() -> Collection:
    return get_database()["TASK_COMPLETIONS"]


def _max_existing_garden_seq() -> int:
    highest = 0
    for user in users_col().find({"gardenCode": {"$regex": r"^BLM\d+$"}}, {"gardenCode": 1}):
        digits = str(user.get("gardenCode", ""))[3:]
        if digits.isdigit():
            highest = max(highest, int(digits))
    return highest


def next_garden_code() -> str:
    highest = _max_existing_garden_seq()
    get_database()["COUNTERS"].update_one(
        {"_id": "gardenCode"},
        {"$max": {"seq": highest}},
        upsert=True,
    )
    counter = get_database()["COUNTERS"].find_one_and_update(
        {"_id": "gardenCode"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return f"BLM{int(counter['seq']):03d}"


def backfill_garden_codes() -> None:
    from app.services.auth import ensure_garden_code

    missing = users_col().find(
        {"$or": [{"gardenCode": {"$exists": False}}, {"gardenCode": None}, {"gardenCode": ""}]}
    )
    for user in missing:
        ensure_garden_code(user)


def ensure_indexes() -> None:
    users_col().create_index("email", unique=True)
    users_col().create_index("username", unique=True)
    users_col().create_index("gardenCode", unique=True, sparse=True)
    friends_col().create_index([("userId", 1), ("friendId", 1)], unique=True)
    trees_col().create_index([("userIds", 1), ("status", 1)])
    backfill_garden_codes()


def close_database_connection() -> None:
    if get_mongo_client.cache_info().currsize:
        get_mongo_client().close()
        get_mongo_client.cache_clear()
