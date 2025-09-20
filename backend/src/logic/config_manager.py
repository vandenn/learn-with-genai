import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from src.logic.projects_manager import get_single_project
from src.models import BaseFolderConfig
from src.settings import settings

CONFIG_FILE_NAME = ".learn_with_genai_config"


def get_active_project() -> Optional[str]:
    config = load_base_folder_config()
    return config.active_project_id


def set_active_project(project_id: str) -> bool:
    try:
        get_single_project(project_id)
    except ValueError:
        return False

    config = load_base_folder_config()
    config.active_project_id = project_id
    config.modified = datetime.now()
    save_base_folder_config(config)
    return True


def get_active_file() -> Optional[str]:
    config = load_base_folder_config()
    return config.active_file_path


def set_active_file(file_path: str) -> None:
    config = load_base_folder_config()
    config.active_file_path = file_path
    config.modified = datetime.now()
    save_base_folder_config(config)


def initialize_config_file() -> None:
    data_path = settings.data_path
    data_path.mkdir(parents=True, exist_ok=True)

    config_path = get_config_path()
    if not config_path.exists():
        config = BaseFolderConfig(
            active_project_id=None,
            active_file_path=None,
            user_settings={},
            created=datetime.now(),
            modified=datetime.now(),
        )
        save_base_folder_config(config)


def load_base_folder_config() -> BaseFolderConfig:
    config_path = get_config_path()
    if not config_path.exists():
        initialize_config_file()

    with open(config_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return BaseFolderConfig(**data)


def save_base_folder_config(config: BaseFolderConfig) -> None:
    config_path = get_config_path()
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config.model_dump(), f, indent=2, default=str)


def get_config_path() -> Path:
    return settings.data_path / CONFIG_FILE_NAME
