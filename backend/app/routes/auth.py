from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/")
def auth_root() -> dict[str, str]:
    return {"message": "Auth routes are ready"}
