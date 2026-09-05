from fastapi import APIRouter

router = APIRouter(prefix="/friends", tags=["friends"])


@router.get("/")
def friends_root() -> dict[str, str]:
    return {"message": "Friends routes are ready"}
