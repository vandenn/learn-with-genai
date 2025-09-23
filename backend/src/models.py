from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class Project(BaseModel):
    id: str
    name: str
    path: str
    file_names: List[str]
    created: datetime
    modified: datetime


class BaseFolderConfig(BaseModel):
    active_project_id: Optional[str] = None
    active_file_name: Optional[str] = None
    user_settings: Dict[str, Any] = Field(default_factory=dict)
    created: datetime
    modified: datetime


class FileContent(BaseModel):
    name: str
    path: str
    content: str
    modified: datetime
    size: int


class AITutorResponse(BaseModel):
    response: str
    success: bool
