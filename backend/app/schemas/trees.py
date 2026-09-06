from pydantic import BaseModel, Field


class CreateTreeRequest(BaseModel):
    friendId: str
    referencePhotoUrl: str = Field(min_length=1)


class TreeResponse(BaseModel):
    id: str
    userIds: list[str]
    speciesId: str | None = None
    growth: int
    status: str
    lastActivityAt: str | None = None
    createdAt: str | None = None
    completedAt: str | None = None
    referencePhotoUrl: str | None = None
