import json

from langchain_core.messages import HumanMessage, SystemMessage

from src.logic.ai_tutor.state.tutor_state import TutorState
from src.logic.ai_tutor.utils import get_llm
from src.prompts.helpers import load_prompt


def analyze_user_query(state: TutorState) -> TutorState:
    llm = get_llm(is_mini=True)

    query_analysis_template = load_prompt("query_analysis_user")
    query_analysis_prompt = query_analysis_template.format(
        user_message=state["user_message"],
        conversation_history=state["conversation_history"],
        highlighted_text=state["highlighted_text"] or "None",
    )

    query_analysis_system = load_prompt("query_analysis_system")

    messages = [
        SystemMessage(content=query_analysis_system),
        HumanMessage(content=query_analysis_prompt),
    ]

    response = llm.invoke(messages).content.strip()

    try:
        analysis = json.loads(response)
        query_type = analysis.get("query_type", "GENERAL")
        state["query_type"] = query_type

        if query_type == "SEARCH":
            # Set search query from user message or extracted keywords
            state["search_query"] = state["user_message"]
            if "keywords" in analysis:
                state["search_query"] = ",".join(analysis["keywords"])
            state["step_messages"].append(
                "I need to search through your project files to answer that question."
            )
        elif query_type == "ADD_TO_NOTE":
            state["step_messages"].append("I'll add the information to your note.")
        else:
            state["step_messages"].append("I'll answer this based on my knowledge.")

    except (json.JSONDecodeError, KeyError):
        # Fallback to general query type if analysis fails
        state["query_type"] = "GENERAL"
        state["step_messages"].append("I'll answer this based on my knowledge.")

    return state
