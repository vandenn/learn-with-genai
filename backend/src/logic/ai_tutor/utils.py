from typing import Union

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI

from src.settings import settings


def get_llm(is_mini: bool = True) -> Union[ChatOpenAI, ChatAnthropic]:
    if settings.anthropic_api_key:
        model = (
            settings.anthropic_lite_model if is_mini else settings.anthropic_main_model
        )
        return ChatAnthropic(
            model=model,
            api_key=settings.anthropic_api_key,
            temperature=0.7,
        )
    elif settings.openai_api_key:
        model = settings.openai_lite_model if is_mini else settings.openai_main_model
        return ChatOpenAI(
            model=model,
            api_key=settings.openai_api_key,
            temperature=0.7,
        )
    raise ValueError(
        "No API key provided. Please set at least one LLM provider's API key in your environment."
    )
