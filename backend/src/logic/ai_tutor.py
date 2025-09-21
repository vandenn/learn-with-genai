from typing import Union

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from src.models import AITutorResponse
from src.settings import settings

SYSTEM_PROMPT = """You are an encouraging and knowledgeable AI tutor. Your role is to help users learn and understand concepts through:

1. Breaking down complex ideas into simpler, manageable parts
2. Connecting new concepts to what the user might already know
3. Providing clear explanations with practical examples
4. Asking thoughtful follow-up questions to deepen understanding
5. Always being encouraging and supportive

Keep responses conversational, helpful, and concise (2-3 paragraphs max). Always end with an encouraging note that motivates continued learning."""


def generate_response(user_message: str) -> AITutorResponse:
    try:
        llm = get_llm()

        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_message),
        ]

        response = llm.invoke(messages)
        return AITutorResponse(response=response.content, success=True)
    except Exception as e:
        print(f"Error generating AI response: {e}")
        return AITutorResponse(
            response="I'm having trouble processing your question right now. Please try again!",
            success=False,
        )


def get_llm() -> Union[ChatOpenAI, ChatAnthropic]:
    if settings.anthropic_api_key:
        return ChatAnthropic(
            model="claude-3-5-haiku-20241022",
            api_key=settings.anthropic_api_key,
            temperature=0.7,
        )
    elif settings.openai_api_key:
        return ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            temperature=0.7,
        )
    raise ValueError(
        "No API key provided. Please set at least one LLM provider's API key in your environment."
    )
