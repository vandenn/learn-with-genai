from pathlib import Path


def load_prompt(prompt_name: str) -> str:
    prompt_path = Path(__file__).parent / f"{prompt_name}.txt"
    return prompt_path.read_text(encoding="utf-8")
