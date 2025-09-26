from typing import Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from src.logic.ai_tutor.graphs.main import stream_ai_tutor_workflow
from src.logic.config_manager import get_active_file_name
from src.logic.projects_manager import open_file_by_id
from src.v1.schema import AITutorChatRequest, AITutorStreamMessage

router = APIRouter(prefix="/ai-tutor", tags=["ai-tutor"])


@router.post("/chat")
async def chat(request: AITutorChatRequest):
    active_file_content: Optional[str] = None
    active_file_name = get_active_file_name()
    if active_file_name:
        try:
            file_content = open_file_by_id(request.project_id, active_file_name)
            active_file_content = file_content.content
        except Exception:
            active_file_content = None

    async def generate_stream():
        try:
            for result in stream_ai_tutor_workflow(
                user_message=request.message,
                project_id=request.project_id,
                conversation_history=request.conversation_history,
                highlighted_text=request.highlighted_text,
                active_file_content=active_file_content,
            ):
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
