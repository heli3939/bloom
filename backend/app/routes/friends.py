from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.schemas.auth import UserPublic
from app.schemas.friends import AddFriendRequest, FriendListResponse
from app.services.friends import add_friend, list_friends

router = APIRouter(prefix="/friends", tags=["friends"])


@router.get("", response_model=FriendListResponse)
def get_friends(current_user: dict = Depends(get_current_user)) -> FriendListResponse:
    return FriendListResponse(friends=[UserPublic(**friend) for friend in list_friends(current_user)])


@router.post("", response_model=UserPublic)
def create_friend(
    body: AddFriendRequest,
    current_user: dict = Depends(get_current_user),
) -> UserPublic:
    return UserPublic(**add_friend(current_user, body.gardenCode))
