from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Task, User, UserRole, Project
from app.schemas import TaskCreate, TaskResponse, TaskUpdate
from app.auth import get_current_user, RoleChecker

router = APIRouter(prefix="", tags=["Tasks"])

@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == UserRole.ADMIN:
        result = await db.execute(
            select(Task)
            .options(selectinload(Task.assigned_to))
            .order_by(Task.due_date.asc())
        )
        return result.scalars().all()
    else:
        # Members only see tasks assigned to them
        result = await db.execute(
            select(Task)
            .options(selectinload(Task.assigned_to))
            .filter(Task.assigned_to_id == current_user.id)
            .order_by(Task.due_date.asc())
        )
        return result.scalars().all()

@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: int,
    task_in: TaskCreate,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    proj_result = await db.execute(select(Project).filter(Project.id == project_id))
    project = proj_result.scalars().first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    # Verify assigned user exists if provided
    if task_in.assigned_to_id is not None:
        user_result = await db.execute(select(User).filter(User.id == task_in.assigned_to_id))
        user = user_result.scalars().first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned user not found")
            
    new_task = Task(
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        due_date=task_in.due_date,
        project_id=project_id,
        assigned_to_id=task_in.assigned_to_id
    )
    
    db.add(new_task)
    await db.commit()
    
    # Reload task with relationships preloaded
    task_result = await db.execute(
        select(Task).options(selectinload(Task.assigned_to)).filter(Task.id == new_task.id)
    )
    return task_result.scalars().first()

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task).options(selectinload(Task.assigned_to)).filter(Task.id == task_id)
    )
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    # Member RBAC checks: Members can only update status on tasks assigned to them
    if current_user.role != UserRole.ADMIN:
        if task.assigned_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update tasks assigned to you."
            )
            
        # Check if trying to edit other fields
        has_invalid_changes = False
        if task_in.title is not None and task_in.title != task.title:
            has_invalid_changes = True
        if task_in.description is not None and task_in.description != task.description:
            has_invalid_changes = True
        if task_in.due_date is not None and task_in.due_date != task.due_date:
            has_invalid_changes = True
        if task_in.assigned_to_id is not None and task_in.assigned_to_id != task.assigned_to_id:
            has_invalid_changes = True
            
        if has_invalid_changes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Members are only permitted to update the task status."
            )
            
    # Apply status update
    if task_in.status is not None:
        task.status = task_in.status
        
    # Apply Admin updates
    if current_user.role == UserRole.ADMIN:
        if task_in.title is not None:
            task.title = task_in.title
        if task_in.description is not None:
            task.description = task_in.description
        if task_in.due_date is not None:
            task.due_date = task_in.due_date
        if task_in.assigned_to_id is not None:
            user_result = await db.execute(select(User).filter(User.id == task_in.assigned_to_id))
            user = user_result.scalars().first()
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assigned user not found")
            task.assigned_to_id = task_in.assigned_to_id
            
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Task).filter(Task.id == task_id))
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    await db.delete(task)
    await db.commit()
    return None
