from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Project, User, UserRole, Task
from app.schemas import ProjectCreate, ProjectResponse, ProjectDetailResponse, AddMemberRequest
from app.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == UserRole.ADMIN:
        result = await db.execute(select(Project).order_by(Project.created_at.desc()))
        return result.scalars().all()
    else:
        # Members only see projects they belong to
        result = await db.execute(
            select(Project)
            .join(Project.members)
            .filter(User.id == current_user.id)
            .order_by(Project.created_at.desc())
        )
        return result.scalars().all()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    new_project = Project(
        name=project_in.name,
        description=project_in.description
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.members),
            selectinload(Project.tasks).selectinload(Task.assigned_to)
        )
        .filter(Project.id == project_id)
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    # Check permissions for non-admin users
    if current_user.role != UserRole.ADMIN:
        is_member = any(m.id == current_user.id for m in project.members)
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this project."
            )
            
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_in: ProjectCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Project).filter(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    project.name = project_in.name
    project.description = project_in.description
    await db.commit()
    await db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Project).filter(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    await db.delete(project)
    await db.commit()
    return None

@router.post("/{project_id}/members", status_code=status.HTTP_200_OK)
async def add_project_member(
    project_id: int,
    member_req: AddMemberRequest,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # Fetch project
    proj_result = await db.execute(
        select(Project).options(selectinload(Project.members)).filter(Project.id == project_id)
    )
    project = proj_result.scalars().first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    # Fetch user to add
    user_result = await db.execute(select(User).filter(User.id == member_req.user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user not in project.members:
        project.members.append(user)
        await db.commit()
        
    return {"message": f"User {user.name} added to project successfully."}

@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_200_OK)
async def remove_project_member(
    project_id: int,
    user_id: int,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # Fetch project
    proj_result = await db.execute(
        select(Project).options(selectinload(Project.members)).filter(Project.id == project_id)
    )
    project = proj_result.scalars().first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    # Fetch user to remove
    user_result = await db.execute(select(User).filter(User.id == user_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user in project.members:
        project.members.remove(user)
        await db.commit()
        
    return {"message": f"User {user.name} removed from project successfully."}
