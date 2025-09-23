from src.logic.ai_tutor.state.tutor_state import TutorState
from src.logic.projects_manager import get_single_project, open_file

TOP_K_FILES = 5


def search_notes(state: TutorState) -> TutorState:
    if state["query_type"] != "SEARCH":
        return state

    state["step_messages"].append(f"Searching for: {state['search_query']}")

    try:
        project = get_single_project(state["current_project_id"])

        found_files = []
        search_terms = state["search_query"].lower().split(",")

        # Simple keyword search
        # TODO: Replace with more sophisticated search (e.g., TF-IDF, semantic search)
        for file_name in project.file_names:
            try:
                file_content = open_file(f"{project.path}/{file_name}.md")
                content_lower = file_content.content.lower()

                # Count matches for each search term
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
                # Skip files that can't be read
                continue

        # Sort by relevance and take top K
        found_files.sort(key=lambda x: x["relevance"], reverse=True)
        state["found_files"] = found_files[:TOP_K_FILES]

        if found_files:
            file_count = len(found_files)
            state["step_messages"].append(
                f"Found {file_count} relevant file(s). Analyzing the content..."
            )

            # Prepare content for LLM processing
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
