from langchain_core.messages import HumanMessage, SystemMessage

from src.logic.ai_tutor.state.tutor_state import TutorState
from src.logic.ai_tutor.utils import get_llm
from src.prompts.helpers import load_prompt


def generate_note_content(state: TutorState) -> TutorState:
    llm = get_llm(is_mini=False)

    note_template = load_prompt("note_generation_user")
    note_prompt = note_template.format(
        user_message=state["user_message"],
        conversation_history=state["conversation_history"],
        highlighted_text=state["highlighted_text"] or "None",
    )

    note_system = load_prompt("note_generation_system")

    messages = [SystemMessage(content=note_system), HumanMessage(content=note_prompt)]

    response = llm.invoke(messages).content
    return {
        "pending_note_edit": response,
        "output_messages": [{"type": "step", "content": "Note content generated."}],
    }
