from fastapi import APIRouter

from src.logic import ai_tutor
from src.v1.schema import AITutorChatRequest, AITutorChatResponse

router = APIRouter(prefix="/ai-tutor", tags=["ai-tutor"])


@router.post("/chat", response_model=AITutorChatResponse)
async def chat(request: AITutorChatRequest):
    tutor_response = ai_tutor.generate_response(request.message)

    return AITutorChatResponse(
        response=tutor_response.response, success=tutor_response.success
    )
