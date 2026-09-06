from datetime import datetime

from bson import ObjectId


def serialize_value(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        return [serialize_value(item) for item in value]
    if isinstance(value, dict):
        return serialize_id(value)
    return value


def serialize_id(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    serialized = {}
    for key, value in doc.items():
        serialized["id" if key == "_id" else key] = serialize_value(value)
    return serialized
