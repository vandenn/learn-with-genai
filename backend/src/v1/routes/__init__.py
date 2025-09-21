from fastapi import APIRouter

from . import ai_tutor, config, projects

router = APIRouter(prefix="/v1")

router.include_router(projects.router)
router.include_router(config.router)
router.include_router(ai_tutor.router)
