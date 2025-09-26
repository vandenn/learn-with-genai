from typing import Any, Dict, List, Optional, TypedDict


class TutorState(TypedDict):
    # User input and context
    user_message: str
    project_id: str | None
    conversation_history: List[Dict[str, Any]]
    highlighted_text: Optional[str]
    active_file_content: Optional[str]

    # Query analysis
    query_type: str  # "SEARCH", "ADD_TO_NOTE", "GENERAL"
    search_query: str

    # Retrieval results
    found_files: List[Dict[str, Any]]
    file_contents: str

    # Generation outputs
    final_response: str
    note_content: str

    # Progress tracking
    step_messages: List[str]
