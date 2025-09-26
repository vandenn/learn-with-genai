from langchain_core.messages import HumanMessage, SystemMessage

from src.logic.ai_tutor.state.tutor_state import TutorState
from src.logic.ai_tutor.utils import get_llm
from src.prompts.helpers import load_prompt


def generate_final_response(state: TutorState) -> TutorState:
    llm = get_llm(is_mini=False)

    if state["file_contents"]:
        # Use context-aware prompt with file contents
        context_template = load_prompt("context_response_user")
        context_prompt = context_template.format(
            user_message=state["user_message"],
            file_contents=state["file_contents"],
            conversation_history=state["conversation_history"],
            active_file_content=state["active_file_content"],
            highlighted_text=state["highlighted_text"] or "None",
        )
    else:
        # Use general knowledge prompt
        general_template = load_prompt("general_response_user")
        context_prompt = general_template.format(
            user_message=state["user_message"],
            conversation_history=state["conversation_history"],
            active_file_content=state["active_file_content"],
            highlighted_text=state["highlighted_text"] or "None",
        )

    system_prompt = load_prompt("response_generation_system")

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=context_prompt),
    ]

    response = llm.invoke(messages).content
    state["final_response"] = response

    return state
