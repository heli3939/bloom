from pydantic import BaseModel, Field


class TaskCatalogItem(BaseModel):
    id: str
    title: str
    description: str
    category: str | None = None
    growthValue: int


class CompletionStatus(BaseModel):
    userId: str
    photoUrl: str | None = None


class DailyTaskResponse(BaseModel):
    id: str
    treeId: str
    taskId: str
    title: str
    description: str
    category: str | None = None
    growthValue: int
    completed: bool
    completions: list[CompletionStatus]


class CompleteTaskRequest(BaseModel):
    photoUrl: str = Field(min_length=1)


class CompleteTaskResponse(BaseModel):
    dailyTasks: list[DailyTaskResponse]
