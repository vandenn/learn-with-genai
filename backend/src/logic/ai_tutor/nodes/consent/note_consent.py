from langgraph.types import interrupt

from src.logic.ai_tutor.state.tutor_state import TutorState


def request_note_edit_consent(state: TutorState) -> TutorState:
    decision = interrupt(
        {
            "type": "note_consent",
            "message": f"I've generated the following:\n{state['pending_note_edit']}\n===\nDo you want me to add this to your notes?",
        }
    )

    if decision["content"] == "approve":
        return {
            "output_messages": [
                {"type": "note", "content": state["pending_note_edit"]},
                {"type": "final", "content": "Successfully edited note!"},
            ],
            "pending_note_edit": "",
        }
    else:
        return {
            "output_messages": [
                {"type": "final", "content": "Operation cancelled by user."}
            ],
            "pending_note_edit": "",
        }
