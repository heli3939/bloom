from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=2, max_length=40)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    profileImage: str | None = None


class LoginRequest(BaseModel):
    password: str
    email: str | None = None
    username: str | None = None


class UserPublic(BaseModel):
    id: str
    username: str
    email: EmailStr
    profileImage: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
