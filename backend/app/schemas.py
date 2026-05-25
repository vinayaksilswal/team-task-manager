from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models import UserRole, TaskStatus

# User Schemas
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.MEMBER

class UserResponse(UserBase):
    id: int
    role: UserRole

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: int | None = None
    role: UserRole | None = None

# Project Schemas
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Task Schemas
class TaskBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: str | None = None
    status: TaskStatus = TaskStatus.PENDING
    due_date: datetime
    assigned_to_id: int | None = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    due_date: datetime | None = None
    assigned_to_id: int | None = None

class TaskResponse(TaskBase):
    id: int
    project_id: int
    assigned_to: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)

# Detailed Project response including tasks and members
class ProjectDetailResponse(ProjectResponse):
    members: list[UserResponse] = []
    tasks: list[TaskResponse] = []

    model_config = ConfigDict(from_attributes=True)

# Simple wrapper for assigning user to project
class AddMemberRequest(BaseModel):
    user_id: int
