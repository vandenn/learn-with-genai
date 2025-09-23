from langgraph.graph import END, StateGraph

from src.logic.ai_tutor.edges.routing import route_after_analysis
from src.logic.ai_tutor.nodes.analysis.query_analysis import analyze_user_query
from src.logic.ai_tutor.nodes.generation.final_response import generate_final_response
from src.logic.ai_tutor.nodes.generation.note_generation import generate_note_content
from src.logic.ai_tutor.nodes.retrieval.note_search import search_notes
from src.logic.ai_tutor.state.tutor_state import TutorState


def create_tutor_workflow() -> StateGraph:
    workflow = StateGraph(TutorState)

    # Add all nodes
    workflow.add_node("analyze_query", analyze_user_query)
    workflow.add_node("search_notes", search_notes)
    workflow.add_node("generate_final_response", generate_final_response)
    workflow.add_node("generate_note_content", generate_note_content)

    workflow.set_entry_point("analyze_query")

    workflow.add_conditional_edges(
        "analyze_query",
        route_after_analysis,
        {
            "search_notes": "search_notes",
            "generate_final_response": "generate_final_response",
            "generate_note_content": "generate_note_content",
        },
    )
    workflow.add_edge("search_notes", "generate_final_response")

    workflow.add_edge("generate_final_response", END)
    workflow.add_edge("generate_note_content", END)

    return workflow.compile()


def stream_ai_tutor_workflow(user_message: str, current_project_id: str):
    workflow = create_tutor_workflow()

    initial_state = TutorState(
        user_message=user_message,
        current_project_id=current_project_id,
        query_type="",
        search_query="",
        found_files=[],
        file_contents="",
        final_response="",
        note_content="",
        step_messages=[],
    )

    previous_step_count = 0

    # Stream results from workflow execution
    for step_result in workflow.stream(initial_state):
        for state in step_result.values():
            # Yield step messages as they're added
            current_step_count = len(state["step_messages"])
            if current_step_count > previous_step_count:
                for i in range(previous_step_count, current_step_count):
                    yield {"type": "step", "content": state["step_messages"][i]}
                previous_step_count = current_step_count

            # Yield note content when available
            if state["note_content"]:
                yield {"type": "note", "content": state["note_content"]}

            # Yield final response when available (always last)
            if state["final_response"]:
                yield {"type": "final", "content": state["final_response"]}
