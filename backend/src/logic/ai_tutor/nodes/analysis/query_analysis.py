import json

from langchain_core.messages import HumanMessage, SystemMessage

from src.logic.ai_tutor.state.tutor_state import TutorState
from src.logic.ai_tutor.utils import get_llm
from src.prompts.helpers import load_prompt


def analyze_user_query(state: TutorState) -> TutorState:
    llm = get_llm(is_mini=True)

    query_analysis_system = load_prompt("query_analysis_system")
    query_analysis_template = load_prompt("query_analysis_user")
    query_analysis_prompt = query_analysis_template.format(
        user_message=state["user_message"],
        conversation_history=state["conversation_history"],
        highlighted_text=state["highlighted_text"] or "None",
    )

    messages = [
        SystemMessage(content=query_analysis_system),
        HumanMessage(content=query_analysis_prompt),
    ]

    response = llm.invoke(messages).content.strip()

    state_update = {
        "output_messages": [
            {"type": "step", "content": "Let me think about that for a bit."}
        ]
    }

    try:
        analysis = json.loads(response)
        query_type = analysis.get("query_type", "GENERAL")
        state_update["query_type"] = query_type

        if query_type == "SEARCH":
            state_update["search_query"] = state["user_message"]
            if "keywords" in analysis:
                state_update["search_query"] = ",".join(analysis["keywords"])
            state_update["output_messages"] = [
                {"type": "step", "content": "Searching your project files..."}
            ]
        elif query_type == "ADD_TO_NOTE":
            state_update["output_messages"] = [
                {
                    "type": "step",
                    "content": "Let me generate some information for your note...",
                }
            ]

    except (json.JSONDecodeError, KeyError):
        # Fallback
        state_update["query_type"] = "GENERAL"
        state_update["output_messages"] = [
            {"type": "step", "content": "Let me think about that for a bit."}
        ]

    return state_update
