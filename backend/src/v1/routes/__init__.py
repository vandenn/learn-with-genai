from fastapi import APIRouter

from . import config, projects

router = APIRouter(prefix="/v1")

router.include_router(projects.router)
router.include_router(config.router)
