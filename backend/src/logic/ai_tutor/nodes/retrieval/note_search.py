from src.logic.ai_tutor.state.tutor_state import TutorState
from src.logic.projects_manager import get_single_project, open_file

TOP_K_FILES = 5


def search_notes(state: TutorState) -> TutorState:
    state_update = {}

    if state["query_type"] != "SEARCH":
        return state_update

    try:
        project = get_single_project(state["project_id"])

        found_files = []
        search_terms = state["search_query"].lower().split(",")

        # Simple keyword search
        # TODO: Replace with more sophisticated search (e.g., TF-IDF, semantic search)
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
        found_files = found_files[:TOP_K_FILES]
        state_update["found_files"] = found_files

        if found_files:
            file_count = len(found_files)
            state_update["output_messages"] = [
                {
                    "type": "step",
                    "content": f"Found {file_count} relevant file(s). Analyzing the content...",
                }
            ]

            # Prepare content for LLM processing
            contents = []
            for file_info in found_files:
                contents.append(
                    f"File: {file_info['file']}\nContent: {file_info['content']}\n---"
                )
            state_update["file_contents"] = "\n".join(contents)
        else:
            state_update["output_messages"] = [
                {"type": "step", "content": "No relevant files found in your project."}
            ]
            state_update["file_contents"] = ""
    except ValueError:
        state_update["output_messages"] = [
            {"type": "step", "content": f"Project not found: {state['project_id']}"}
        ]
        state_update["file_contents"] = ""
    except Exception:
        state_update["output_messages"] = [
            {
                "type": "step",
                "content": "Had trouble searching files, but I'll do my best to help.",
            }
        ]
        state_update["file_contents"] = ""

    return state_update
