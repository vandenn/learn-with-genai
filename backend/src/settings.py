from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    data_folder: str = Field(
        default="data", description="Folder to store user projects and files"
    )

    openai_api_key: str = Field(default="", description="OpenAI API key")
    anthropic_api_key: str = Field(default="", description="Anthropic API key")

    anthropic_main_model: str = Field(
        default="claude-sonnet-4-20250514", description="Anthropic main model"
    )
    anthropic_lite_model: str = Field(
        default="claude-3-5-haiku-20241022", description="Anthropic lite model"
    )
    openai_main_model: str = Field(default="gpt-4o", description="OpenAI main model")
    openai_lite_model: str = Field(
        default="gpt-4o-mini", description="OpenAI lite model"
    )

    @property
    def data_path(self) -> Path:
        if Path(self.data_folder).is_absolute():
            return Path(self.data_folder)
        else:
            return Path(__file__).parent.parent.parent / self.data_folder


settings = Settings()  # from src.settings import settings
