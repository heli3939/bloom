from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class TreeCreate(BaseModel):
    user_ids: List[str] = Field(alias="userIds", min_length=2, max_length=2)
    species_id: str = Field(alias="speciesId")
    reference_photo_url: str = Field(alias="referencePhotoUrl", min_length=1)


class TreeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    user_ids: List[str] = Field(alias="userIds")
    species_id: str = Field(alias="speciesId")
    reference_photo_url: str = Field(alias="referencePhotoUrl")
    growth: int
    status: str
    last_activity_at: datetime = Field(alias="lastActivityAt")
    created_at: datetime = Field(alias="createdAt")
    completed_at: Optional[datetime] = Field(default=None, alias="completedAt")
