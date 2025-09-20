from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    data_folder: str = Field(
        default="data", description="Folder to store user projects and files"
    )

    @property
    def data_path(self) -> Path:
        """Get the absolute path to the data folder"""
        if Path(self.data_folder).is_absolute():
            return Path(self.data_folder)
        else:
            return Path(__file__).parent.parent.parent / self.data_folder


settings = Settings()  # from src.settings import settings
