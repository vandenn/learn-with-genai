from typing import Any, Dict, List, TypedDict


class TutorState(TypedDict):
    # User input and context
    user_message: str
    current_project_id: str | None

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
