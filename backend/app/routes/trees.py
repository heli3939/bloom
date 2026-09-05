from fastapi import APIRouter

router = APIRouter(prefix="/trees", tags=["trees"])


@router.get("/")
def trees_root() -> dict[str, str]:
    return {"message": "Tree routes are ready"}
