from src.logic.ai_tutor.state.tutor_state import TutorState


def route_after_analysis(state: TutorState) -> str:
    query_type = state.get("query_type", "GENERAL")

    if query_type == "ADD_TO_NOTE":
        return "generate_note_content"
    elif query_type == "SEARCH":
        return "search_notes"
    else:
        return "generate_final_response"
