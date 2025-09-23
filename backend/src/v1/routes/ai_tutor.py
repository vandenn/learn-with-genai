from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.logic.ai_tutor.graphs.main import stream_ai_tutor_workflow
from src.v1.schema import AITutorChatRequest, AITutorStreamMessage

router = APIRouter(prefix="/ai-tutor", tags=["ai-tutor"])


@router.post("/chat")
async def chat(request: AITutorChatRequest):
    async def generate_stream():
        try:
            for result in stream_ai_tutor_workflow(request.message, request.project_id):
                stream_msg = AITutorStreamMessage(
                    type=result["type"], content=result["content"]
                )
                yield f"data: {stream_msg.model_dump_json()}\n\n"
        except Exception as e:
            error_msg = AITutorStreamMessage(
                type="final",
                content="I'm having trouble processing your question right now. Please try again!",
            )
            print(f"Error: {e}")
            yield f"data: {error_msg.model_dump_json()}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/plain",
        },
    )
