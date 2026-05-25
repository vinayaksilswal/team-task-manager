from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserResponse
from app.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("", response_model=list[UserResponse])
async def list_users(
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(User.name.asc()))
    return result.scalars().all()
