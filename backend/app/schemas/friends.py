from pydantic import BaseModel, Field

from app.schemas.auth import UserPublic


class AddFriendRequest(BaseModel):
    username: str | None = Field(default=None, min_length=1)
    gardenCode: str | None = None


class FriendListResponse(BaseModel):
    friends: list[UserPublic]
