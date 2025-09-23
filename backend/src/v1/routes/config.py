from fastapi import APIRouter, HTTPException

from src.logic import config_manager
from src.v1.schema import (
    ActiveFileReponse,
    ActiveProjectResponse,
    BaseFolderConfigResponse,
    SetActiveFileRequest,
    SetActiveProjectRequest,
    SuccessResponse,
    config_to_response,
)

router = APIRouter(prefix="/config", tags=["config"])


@router.get("/", response_model=BaseFolderConfigResponse)
async def get_config():
    try:
        config = config_manager.load_base_folder_config()
        return config_to_response(config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active-project", response_model=ActiveProjectResponse)
async def get_active_project():
    try:
        active_project_id = config_manager.get_active_project()
        return ActiveProjectResponse(project_id=active_project_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/active-project", response_model=SuccessResponse)
async def set_active_project(request: SetActiveProjectRequest):
    try:
        success = config_manager.set_active_project(request.project_id)
        if not success and request.project_id is not None:
            raise HTTPException(status_code=404, detail="Project not found")
        return SuccessResponse(success=True)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/active-file", response_model=ActiveFileReponse)
async def get_active_file():
    try:
        active_file_name = config_manager.get_active_file()
        return ActiveFileReponse(file_name=active_file_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/active-file", response_model=SuccessResponse)
async def set_active_file(request: SetActiveFileRequest):
    try:
        config_manager.set_active_file(request.file_name)
        return SuccessResponse(success=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
