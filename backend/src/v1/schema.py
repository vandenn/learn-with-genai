from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from src.models import BaseFolderConfig, FileContent, Project

# ================================
# REQUEST SCHEMAS
# ================================


class CreateProjectRequest(BaseModel):
    name: str


class SetActiveProjectRequest(BaseModel):
    project_id: str


class SetActiveFileRequest(BaseModel):
    file_path: str


class CreateFileRequest(BaseModel):
    filename: str


class SaveFileRequest(BaseModel):
    content: str


class OpenFileRequest(BaseModel):
    file_path: str


class SetBaseFolderRequest(BaseModel):
    path: str


# ================================
# RESPONSE SCHEMAS
# ================================


class ProjectResponse(BaseModel):
    id: str
    name: str
    path: str
    file_names: List[str]
    created: datetime
    modified: datetime


class FileContentResponse(BaseModel):
    name: str
    path: str
    content: str
    modified: datetime
    size: int


class ActiveProjectResponse(BaseModel):
    project_id: Optional[str]


class ActiveFileReponse(BaseModel):
    file_path: Optional[str]


class BaseFolderConfigResponse(BaseModel):
    active_project_id: Optional[str] = None
    active_file_path: Optional[str] = None
    user_settings: Dict[str, Any] = Field(default_factory=dict)
    created: datetime
    modified: datetime


class SuccessResponse(BaseModel):
    success: bool


# ================================
# MODEL TO SCHEMA CONVERTERS
# ================================


def project_to_response(project: Project) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        name=project.name,
        path=project.path,
        file_names=project.file_names,
        created=project.created,
        modified=project.modified,
    )


def config_to_response(config: BaseFolderConfig) -> BaseFolderConfigResponse:
    return BaseFolderConfigResponse(
        active_project_id=config.active_project_id,
        active_file_path=config.active_file_path,
        user_settings=config.user_settings,
        created=config.created,
        modified=config.modified,
    )


def file_content_to_response(file_content: FileContent) -> FileContentResponse:
    return FileContentResponse(
        name=file_content.name,
        path=file_content.path,
        content=file_content.content,
        modified=file_content.modified,
        size=file_content.size,
    )
