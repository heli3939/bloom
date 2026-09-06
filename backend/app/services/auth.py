from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from pymongo.errors import DuplicateKeyError

from app.config import get_settings
from app.database import next_sequence, users_col
from app.models.serialize import serialize_id


def _format_garden_code(seq: int) -> str:
    return f"BLM{seq:03d}"


def allocate_garden_code() -> str:
    return _format_garden_code(next_sequence("garden_code"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.jwt_secret,
        algorithm="HS256",
    )


def decode_access_token(token: str) -> str:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user_id


def user_public(doc: dict) -> dict:
    serialized = serialize_id(doc) or {}
    serialized.pop("passwordHash", None)
    return serialized


def register_user(username: str, email: str, password: str, profile_image: str | None) -> dict:
    document = {
        "username": username.strip(),
        "email": email.strip().lower(),
        "passwordHash": hash_password(password),
        "gardenCode": allocate_garden_code(),
        "profileImage": profile_image,
        "createdAt": datetime.now(timezone.utc),
    }
    try:
        result = users_col().insert_one(document)
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already exists",
        ) from exc
    document["_id"] = result.inserted_id
    return user_public(document)


def authenticate_user(email: str, password: str) -> dict:
    user = users_col().find_one({"email": email.strip().lower()})
    if user is None or not verify_password(password, user.get("passwordHash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return user


def backfill_garden_codes() -> None:
    """Assign a gardenCode to any user missing one, ordered by createdAt."""
    missing = users_col().find(
        {"$or": [{"gardenCode": {"$exists": False}}, {"gardenCode": None}]},
        sort=[("createdAt", 1)],
    )
    for user in missing:
        users_col().update_one(
            {"_id": user["_id"]},
            {"$set": {"gardenCode": allocate_garden_code()}},
        )


def get_user_by_id(user_id: str) -> dict:
    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    user = users_col().find_one({"_id": object_id})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
