from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DailyTaskResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    tree_id: str = Field(alias="treeId")
    task_id: str = Field(alias="taskId")
    title: str
    description: str
    growth_value: int = Field(alias="growthValue")
    task_date: datetime = Field(alias="taskDate")
    completed: bool
    submission_count: int = Field(alias="submissionCount")
    submitted_user_ids: list[str] = Field(alias="submittedUserIds")


class TaskSubmissionCreate(BaseModel):
    user_id: str = Field(alias="userId")
    photo_url: str = Field(alias="photoUrl", min_length=1)


class TaskSubmissionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    daily_task_id: str = Field(alias="dailyTaskId")
    tree_id: str = Field(alias="treeId")
    user_id: str = Field(alias="userId")
    photo_url: str = Field(alias="photoUrl")
    completed_at: datetime = Field(alias="completedAt")
    task_completed: bool = Field(alias="taskCompleted")
    tree_growth: int = Field(alias="treeGrowth")
