from operator import add
from typing import Annotated, Any, Dict, List, TypedDict


class TutorState(TypedDict):
    # User input and context
    user_message: str
    project_id: str
    conversation_history: List[Dict[str, Any]]
    highlighted_text: str
    active_file_content: str

    # Query analysis
    query_type: str  # "SEARCH", "ADD_TO_NOTE", "GENERAL"

    # Search and retrieval
    search_query: str
    found_files: List[Dict[str, Any]]
    file_contents: str

    # Note generation
    pending_note_edit: str

    # Ouput
    output_messages: Annotated[List[Dict[str, str]], add]
