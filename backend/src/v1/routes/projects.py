from typing import List

from fastapi import APIRouter, HTTPException

from src.logic import projects_manager
from src.v1.schema import (
    CreateFileRequest,
    CreateProjectRequest,
    FileContentResponse,
    ProjectResponse,
    RenameFileRequest,
    RenameProjectRequest,
    SaveFileRequest,
    SuccessResponse,
    file_content_to_response,
    project_to_response,
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[ProjectResponse])
async def get_all_projects():
    try:
        projects = projects_manager.get_all_projects()
        return [project_to_response(project) for project in projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", response_model=ProjectResponse)
async def create_project(request: CreateProjectRequest):
    try:
        project = projects_manager.create_project(request.name)
        return project_to_response(project)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_single_project(project_id: str):
    try:
        project = projects_manager.get_single_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project_to_response(project)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{project_id}/rename", response_model=ProjectResponse)
async def rename_project(project_id: str, request: RenameProjectRequest):
    try:
        project = projects_manager.rename_project(project_id, request.new_name)
        return project_to_response(project)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{project_id}", response_model=SuccessResponse)
async def delete_project(project_id: str):
    try:
        success = projects_manager.delete_project(project_id)
        return SuccessResponse(success=success)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{project_id}/files", response_model=FileContentResponse)
async def create_file(project_id: str, request: CreateFileRequest):
    try:
        file_content = projects_manager.create_file(project_id, request.filename)
        return file_content_to_response(file_content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{project_id}/files/{file_id}", response_model=FileContentResponse)
async def open_file(project_id: str, file_id: str):
    try:
        content = projects_manager.open_file_by_id(project_id, file_id)
        return file_content_to_response(content)
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{project_id}/files/{file_id}", response_model=SuccessResponse)
async def save_file(project_id: str, file_id: str, request: SaveFileRequest):
    try:
        success = projects_manager.save_file_by_id(project_id, file_id, request.content)
        return SuccessResponse(success=success)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{project_id}/files/{file_id}/rename", response_model=FileContentResponse)
async def rename_file(project_id: str, file_id: str, request: RenameFileRequest):
    try:
        file_content = projects_manager.rename_file(
            project_id, file_id, request.new_name
        )
        return file_content_to_response(file_content)
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{project_id}/files/{file_id}", response_model=SuccessResponse)
async def delete_file(project_id: str, file_id: str):
    try:
        success = projects_manager.delete_file(project_id, file_id)
        return SuccessResponse(success=success)
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))
