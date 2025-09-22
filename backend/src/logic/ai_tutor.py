import json
from typing import Any, Dict, List, TypedDict, Union

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from src.logic.projects_manager import get_single_project, open_file
from src.prompts.helpers import load_prompt
from src.settings import settings


class WorkflowState(TypedDict):
    user_message: str
    current_project_id: str | None
    query_type: str  # "SEARCH", "ADD_TO_NOTE", "GENERAL"
    search_query: str
    found_files: List[Dict[str, Any]]
    file_contents: str
    final_response: str
    note_content: str
    step_messages: List[str]


def stream_ai_tutor_workflow(user_message: str, current_project_id: str):
    workflow = create_workflow()

    initial_state = WorkflowState(
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

    for step_result in workflow.stream(initial_state):
        for state in step_result.values():
            current_step_count = len(state["step_messages"])
            if current_step_count > previous_step_count:
                for i in range(previous_step_count, current_step_count):
                    yield {"type": "step", "content": state["step_messages"][i]}
                previous_step_count = current_step_count
            if state["final_response"]:
                yield {"type": "final", "content": state["final_response"]}
            if state["note_content"]:
                yield {"type": "note", "content": state["note_content"]}


def create_workflow() -> StateGraph:
    workflow = StateGraph(WorkflowState)

    workflow.add_node("analyze_query", analyze_query)
    workflow.add_node("search_files", search_files)
    workflow.add_node("generate_response", generate_response)
    workflow.add_node("generate_note", generate_note)

    workflow.set_entry_point("analyze_query")

    workflow.add_conditional_edges(
        "analyze_query",
        route_next_step,
        {
            "search_files": "search_files",
            "generate_response": "generate_response",
            "generate_note": "generate_note",
        },
    )

    workflow.add_edge("search_files", "generate_response")
    workflow.add_edge("generate_response", END)
    workflow.add_edge("generate_note", END)

    return workflow.compile()


def analyze_query(state: WorkflowState) -> WorkflowState:
    llm = get_llm(is_mini=True)

    query_analysis_template = load_prompt("query_analysis_user")
    query_analysis_prompt = query_analysis_template.format(
        user_message=state["user_message"]
    )

    query_analysis_system = load_prompt("query_analysis_system")

    messages = [
        SystemMessage(content=query_analysis_system),
        HumanMessage(content=query_analysis_prompt),
    ]

    response = llm.invoke(messages).content.strip()

    analysis = json.loads(response)
    query_type = analysis.get("query_type", "GENERAL")
    state["query_type"] = query_type

    if query_type == "SEARCH":
        state["search_query"] = state[
            "user_message"
        ]  # Set user message as query by default
        if "keywords" in analysis:
            state["search_query"] = ",".join(analysis["keywords"])
        state["step_messages"].append(
            "I need to search through your project files to answer that question."
        )
    elif query_type == "ADD_TO_NOTE":
        state["step_messages"].append("I'll add the information to your note.")
    else:
        state["step_messages"].append("I'll answer this based on my knowledge.")

    return state


TOP_K_FILES = 5


def search_files(state: WorkflowState) -> WorkflowState:
    if state["query_type"] != "SEARCH":
        return state

    state["step_messages"].append(f"Searching for: {state['search_query']}")

    try:
        project = get_single_project(state["current_project_id"])

        found_files = []
        search_terms = state["search_query"].lower().split(",")

        # Simple keyword search
        # TODO: Replace with more sophisticated search
        for file_name in project.file_names:
            try:
                file_content = open_file(f"{project.path}/{file_name}.md")
                content_lower = file_content.content.lower()

                matches = sum(1 for term in search_terms if term in content_lower)

                if matches > 0:
                    found_files.append(
                        {
                            "project": project.name,
                            "file": file_name,
                            "path": file_content.path,
                            "content": file_content.content,
                            "relevance": matches,
                        }
                    )
            except Exception:
                continue

        found_files.sort(key=lambda x: x["relevance"], reverse=True)
        state["found_files"] = found_files[:TOP_K_FILES]

        if found_files:
            file_count = len(found_files)
            state["step_messages"].append(
                f"Found {file_count} relevant file(s). Analyzing the content..."
            )

            contents = []
            for file_info in state["found_files"]:
                contents.append(
                    f"File: {file_info['file']}\nContent: {file_info['content']}\n---"
                )
            state["file_contents"] = "\n".join(contents)
        else:
            state["step_messages"].append("No relevant files found in your project.")
            state["file_contents"] = ""

    except ValueError:
        state["step_messages"].append(
            f"Project not found: {state['current_project_id']}"
        )
        state["file_contents"] = ""
    except Exception:
        state["step_messages"].append(
            "Had trouble searching files, but I'll do my best to help."
        )
        state["file_contents"] = ""

    return state


def generate_response(state: WorkflowState) -> WorkflowState:
    llm = get_llm(is_mini=False)

    if state["file_contents"]:
        context_template = load_prompt("context_response_user")
        context_prompt = context_template.format(
            user_message=state["user_message"], file_contents=state["file_contents"]
        )
    else:
        general_template = load_prompt("general_response_user")
        context_prompt = general_template.format(user_message=state["user_message"])

    system_prompt = load_prompt("response_generation_system")

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=context_prompt),
    ]

    response = llm.invoke(messages).content
    state["final_response"] = response

    return state


def generate_note(state: WorkflowState) -> WorkflowState:
    llm = get_llm(is_mini=False)

    note_template = load_prompt("note_generation_user")
    note_prompt = note_template.format(conversation_content=state["user_message"])

    note_system = load_prompt("note_generation_system")

    messages = [SystemMessage(content=note_system), HumanMessage(content=note_prompt)]

    response = llm.invoke(messages).content
    state["note_content"] = response

    return state


def route_next_step(state: WorkflowState) -> str:
    if state["query_type"] == "ADD_TO_NOTE":
        return "generate_note"
    elif state["query_type"] == "SEARCH":
        return "search_files"
    else:
        return "generate_response"


def get_llm(is_mini: bool = True) -> Union[ChatOpenAI, ChatAnthropic]:
    if settings.anthropic_api_key:
        model = "claude-3-5-haiku-20241022" if is_mini else "claude-3-5-sonnet-20241022"
        return ChatAnthropic(
            model=model,
            api_key=settings.anthropic_api_key,
            temperature=0.7,
        )
    elif settings.openai_api_key:
        model = "gpt-4o-mini" if is_mini else "gpt-4o"
        return ChatOpenAI(
            model=model,
            api_key=settings.openai_api_key,
            temperature=0.7,
        )
    raise ValueError(
        "No API key provided. Please set at least one LLM provider's API key in your environment."
    )
