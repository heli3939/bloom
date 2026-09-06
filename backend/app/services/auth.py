from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from pymongo.errors import DuplicateKeyError

from app.config import get_settings
from app.database import next_garden_code, users_col
from app.models.serialize import serialize_id

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


def ensure_garden_code(doc: dict) -> dict:
    if doc.get("gardenCode"):
        return doc
    for _ in range(12):
        code = next_garden_code()
        try:
            users_col().update_one({"_id": doc["_id"]}, {"$set": {"gardenCode": code}})
        except DuplicateKeyError:
            continue
        doc["gardenCode"] = code
        return doc
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not assign a garden ID",
    )


def user_public(doc: dict) -> dict:
    serialized = serialize_id(doc) or {}
    serialized.pop("passwordHash", None)
    return serialized


def register_user(username: str, email: str, password: str, profile_image: str | None) -> dict:
    base = {
        "username": username.strip(),
        "email": email.strip().lower(),
        "passwordHash": hash_password(password),
        "profileImage": profile_image,
        "createdAt": datetime.now(timezone.utc),
    }
    last_error: DuplicateKeyError | None = None
    for _ in range(12):
        document = {**base, "gardenCode": next_garden_code()}
        try:
            result = users_col().insert_one(document)
        except DuplicateKeyError as exc:
            last_error = exc
            key = (exc.details or {}).get("keyPattern") or (exc.details or {}).get("keyValue") or {}
            if "gardenCode" in key:
                continue
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username or email already exists",
            ) from exc
        document["_id"] = result.inserted_id
        return user_public(document)
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Username or email already exists",
    ) from last_error


def authenticate_user(identifier: str, password: str) -> dict:
    value = identifier.strip()
    if not value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if "@" in value:
        user = users_col().find_one({"email": value.lower()})
    else:
        user = users_col().find_one({"username": value})
        if user is None:
            digits = "".join(character for character in value if character.isdigit())
            if digits:
                user = users_col().find_one({"email": f"{digits}@phone.bloom.app"})

    if user is None or not verify_password(password, user.get("passwordHash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return user


def get_user_by_id(user_id: str) -> dict:
    try:
        object_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    user = users_col().find_one({"_id": object_id})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return ensure_garden_code(user)
