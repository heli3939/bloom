from pydantic import BaseModel, Field

from app.schemas.auth import UserPublic


class AddFriendRequest(BaseModel):
    gardenCode: str = Field(min_length=4, max_length=16)


class FriendListResponse(BaseModel):
    friends: list[UserPublic]
