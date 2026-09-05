import random
from datetime import date, datetime, time, timezone
from typing import Any, Dict, List

from bson import ObjectId
from pymongo import ASCENDING, ReturnDocument
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError


class BloomError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def object_id(value: str, field_name: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise BloomError(422, f"Invalid {field_name}")
    return ObjectId(value)


def utc_day(value: date) -> datetime:
    return datetime.combine(value, time.min, tzinfo=timezone.utc)


def serialize_tree(tree: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(tree)
    result["_id"] = str(result["_id"])
    result["userIds"] = [str(user_id) for user_id in result["userIds"]]
    result["speciesId"] = str(result["speciesId"])
    return result


def ensure_indexes(db: Database) -> None:
    db.DAILY_TASKS.create_index(
        [("treeId", ASCENDING), ("taskDate", ASCENDING), ("taskId", ASCENDING)],
        unique=True,
    )
    db.TASK_COMPLETIONS.create_index(
        [("dailyTaskId", ASCENDING), ("userId", ASCENDING)], unique=True
    )


def create_tree(db: Database, payload: Dict[str, Any]) -> Dict[str, Any]:
    user_ids = [object_id(value, "userId") for value in payload["userIds"]]
    if user_ids[0] == user_ids[1]:
        raise BloomError(422, "A tree must belong to two different users")

    species_id = object_id(payload["speciesId"], "speciesId")
    if db.USERS.count_documents({"_id": {"$in": user_ids}}) != 2:
        raise BloomError(404, "One or both users were not found")
    if not db.TREE_SPECIES.find_one({"_id": species_id}):
        raise BloomError(404, "Tree species was not found")

    now = datetime.now(timezone.utc)
    tree = {
        "userIds": user_ids,
        "speciesId": species_id,
        "referencePhotoUrl": payload["referencePhotoUrl"],
        "growth": 0,
        "status": "active",
        "lastActivityAt": now,
        "createdAt": now,
    }
    tree["_id"] = db.TREES.insert_one(tree).inserted_id
    return serialize_tree(tree)


def get_tree(db: Database, tree_id: str) -> Dict[str, Any]:
    tree = db.TREES.find_one({"_id": object_id(tree_id, "treeId")})
    if not tree:
        raise BloomError(404, "Tree was not found")
    return serialize_tree(tree)


def get_or_create_daily_tasks(
    db: Database, tree_id: str, task_day: date
) -> List[Dict[str, Any]]:
    ensure_indexes(db)
    tree_object_id = object_id(tree_id, "treeId")
    if not db.TREES.find_one({"_id": tree_object_id}):
        raise BloomError(404, "Tree was not found")

    task_date = utc_day(task_day)
    daily_tasks = list(db.DAILY_TASKS.find({"treeId": tree_object_id, "taskDate": task_date}))
    if not daily_tasks:
        available_tasks = list(db.TASKS.find())
        if len(available_tasks) < 5:
            raise BloomError(409, "At least five tasks are required to create a daily set")
        selector = random.Random(f"{tree_object_id}:{task_date.date().isoformat()}")
        selected_tasks = selector.sample(available_tasks, 5)
        documents = [
            {
                "treeId": tree_object_id,
                "taskId": task["_id"],
                "taskDate": task_date,
                "completed": False,
            }
            for task in selected_tasks
        ]
        try:
            db.DAILY_TASKS.insert_many(documents)
            daily_tasks = documents
        except DuplicateKeyError:
            daily_tasks = list(
                db.DAILY_TASKS.find({"treeId": tree_object_id, "taskDate": task_date})
            )

    task_ids = [item["taskId"] for item in daily_tasks]
    tasks_by_id = {task["_id"]: task for task in db.TASKS.find({"_id": {"$in": task_ids}})}
    submissions_by_daily_task = {
        item["_id"]: list(db.TASK_COMPLETIONS.find({"dailyTaskId": item["_id"]}))
        for item in daily_tasks
    }
    return [
        {
            "_id": str(item["_id"]),
            "treeId": str(item["treeId"]),
            "taskId": str(item["taskId"]),
            "title": tasks_by_id[item["taskId"]]["title"],
            "description": tasks_by_id[item["taskId"]]["description"],
            "growthValue": tasks_by_id[item["taskId"]]["growthValue"],
            "taskDate": item["taskDate"],
            "completed": item.get("completed", False),
            "submissionCount": len(submissions_by_daily_task[item["_id"]]),
            "submittedUserIds": [
                str(submission["userId"])
                for submission in submissions_by_daily_task[item["_id"]]
            ],
        }
        for item in daily_tasks
    ]


def submit_daily_task(
    db: Database, daily_task_id: str, payload: Dict[str, Any]
) -> Dict[str, Any]:
    ensure_indexes(db)
    daily_id = object_id(daily_task_id, "dailyTaskId")
    user_id = object_id(payload["userId"], "userId")
    daily_task = db.DAILY_TASKS.find_one({"_id": daily_id})
    if not daily_task:
        raise BloomError(404, "Daily task was not found")

    tree = db.TREES.find_one({"_id": daily_task["treeId"]})
    if not tree:
        raise BloomError(404, "Tree was not found")
    if user_id not in tree["userIds"]:
        raise BloomError(403, "User does not belong to this tree")
    if tree.get("status") != "active":
        raise BloomError(409, "Tree is not active")

    completed_filter = {
        "treeId": daily_task["treeId"],
        "taskDate": daily_task["taskDate"],
        "completed": True,
    }
    if db.DAILY_TASKS.count_documents(completed_filter) >= 3:
        raise BloomError(409, "Three tasks have already been completed today")

    now = datetime.now(timezone.utc)
    submission = {
        "dailyTaskId": daily_id,
        "treeId": daily_task["treeId"],
        "userId": user_id,
        "photoUrl": payload["photoUrl"],
        "completedAt": now,
    }
    try:
        submission["_id"] = db.TASK_COMPLETIONS.insert_one(submission).inserted_id
    except DuplicateKeyError:
        raise BloomError(409, "This user has already submitted this daily task")

    task_completed = False
    if db.TASK_COMPLETIONS.count_documents({"dailyTaskId": daily_id}) >= 2:
        completion = db.DAILY_TASKS.update_one(
            {"_id": daily_id, "completed": False}, {"$set": {"completed": True}}
        )
        task_completed = completion.modified_count == 1
        if task_completed:
            task = db.TASKS.find_one({"_id": daily_task["taskId"]})
            growth_value = task["growthValue"] if task else 0
            updated_tree = db.TREES.find_one_and_update(
                {"_id": tree["_id"]},
                {"$inc": {"growth": growth_value}, "$set": {"lastActivityAt": now}},
                return_document=ReturnDocument.AFTER,
            )
            new_growth = min(100, updated_tree.get("growth", 0))
            if new_growth == 100:
                db.TREES.update_one(
                    {"_id": tree["_id"]},
                    {
                        "$set": {
                            "growth": 100,
                            "status": "completed",
                            "completedAt": now,
                        }
                    },
                )
            tree["growth"] = new_growth

    return {
        "_id": str(submission["_id"]),
        "dailyTaskId": str(daily_id),
        "treeId": str(daily_task["treeId"]),
        "userId": str(user_id),
        "photoUrl": submission["photoUrl"],
        "completedAt": now,
        "taskCompleted": task_completed,
        "treeGrowth": tree.get("growth", 0),
    }
