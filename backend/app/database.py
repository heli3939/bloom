from functools import lru_cache

from pymongo import MongoClient
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


def ensure_indexes() -> None:
    users_col().create_index("email", unique=True)
    users_col().create_index("username", unique=True)
    friends_col().create_index([("userId", 1), ("friendId", 1)], unique=True)
    trees_col().create_index([("userIds", 1), ("status", 1)])


def close_database_connection() -> None:
    if get_mongo_client.cache_info().currsize:
        get_mongo_client().close()
        get_mongo_client.cache_clear()
