from pydantic import BaseModel, Field

from app.schemas.auth import UserPublic


class AddFriendRequest(BaseModel):
    username: str = Field(min_length=1)


class FriendListResponse(BaseModel):
    friends: list[UserPublic]
