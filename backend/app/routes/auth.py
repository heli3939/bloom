from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_current_user
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from app.services.auth import authenticate_user, create_access_token, register_user, user_public

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest) -> TokenResponse:
    user = register_user(body.username, body.email, body.password, body.profileImage)
    return TokenResponse(access_token=create_access_token(user["id"]), user=UserPublic(**user))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest) -> TokenResponse:
    identifier = body.email or body.username
    if not identifier:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or username is required")
    user = user_public(ensure_garden_code(authenticate_user(identifier, body.password)))
    return TokenResponse(access_token=create_access_token(user["id"]), user=UserPublic(**user))


@router.get("/me", response_model=UserPublic)
def me(current_user: dict = Depends(get_current_user)) -> UserPublic:
    return UserPublic(**current_user)
