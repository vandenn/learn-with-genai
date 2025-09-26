import sqlite3
from typing import Any, Dict, List

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, StateGraph
from langgraph.types import Command

from src.logic.ai_tutor.edges.routing import route_after_analysis
from src.logic.ai_tutor.nodes.analysis.query_analysis import analyze_user_query
from src.logic.ai_tutor.nodes.consent.note_consent import request_note_edit_consent
from src.logic.ai_tutor.nodes.generation.final_response import generate_final_response
from src.logic.ai_tutor.nodes.generation.note_generation import generate_note_content
from src.logic.ai_tutor.nodes.retrieval.note_search import search_notes
from src.logic.ai_tutor.state.tutor_state import TutorState
from src.settings import settings


def create_tutor_graph_builder() -> StateGraph:
    graph = StateGraph(TutorState)

    graph.add_node("analyze_query", analyze_user_query)
    graph.add_node("search_notes", search_notes)
    graph.add_node("generate_final_response", generate_final_response)
    graph.add_node("generate_note_content", generate_note_content)
    graph.add_node("request_note_edit_consent", request_note_edit_consent)

    graph.set_entry_point("analyze_query")

    graph.add_conditional_edges(
        "analyze_query",
        route_after_analysis,
        {
            "search_notes": "search_notes",
            "generate_final_response": "generate_final_response",
            "generate_note_content": "generate_note_content",
        },
    )

    graph.add_edge("search_notes", "generate_final_response")
    graph.add_edge("generate_final_response", END)

    graph.add_edge("generate_note_content", "request_note_edit_consent")
    graph.add_edge("request_note_edit_consent", END)

    return graph


def stream_ai_tutor_workflow(
    user_message: str,
    project_id: str,
    thread_id: str,
    conversation_history: List[Dict[str, Any]] = [],
    highlighted_text: str = "",
    active_file_content: str = "",
    hitl_input: Dict[str, any] = {},
):
    graph_builder = create_tutor_graph_builder()

    checkpointer = SqliteSaver(
        sqlite3.connect(
            settings.data_path / "ai_tutor_state.db", check_same_thread=False
        )
    )
    graph = graph_builder.compile(checkpointer=checkpointer)

    if (
        hitl_input
    ):  # We assume if there's any kind of human-in-the-loop input, it's a resumption
        graph_input = Command(resume=hitl_input)
    else:  # Initial state
        graph_input = TutorState(
            user_message=user_message,
            project_id=project_id,
            conversation_history=conversation_history,
            highlighted_text=highlighted_text,
            active_file_content=active_file_content,
            query_type="",
            search_query="",
            found_files=[],
            file_contents="",
            pending_note_edit="",
            output_messages=[],
        )

    config = {"configurable": {"thread_id": thread_id}}

    for step_result in graph.stream(graph_input, config):
        if "__interrupt__" in step_result:
            interrupt_type = step_result["__interrupt__"][0].value["type"]
            if interrupt_type == "note_consent":
                message = step_result["__interrupt__"][0].value["message"]
                yield {"type": "consent", "content": message}
            else:
                yield {"type": "consent", "content": "Do you consent to the changes?"}
        else:
            step_state = list(step_result.values())[0]
            if "output_messages" in step_state:
                for output_message in step_state["output_messages"]:
                    yield {
                        "type": output_message["type"],
                        "content": output_message["content"],
                    }
