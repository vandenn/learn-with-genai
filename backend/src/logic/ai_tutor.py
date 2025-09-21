import random
import time

from src.models import AITutorResponse

CANNED_RESPONSES = [
    "That's a great question! Let me help you understand this concept better. Think of it as building blocks - each piece connects to create the bigger picture.",
    "I can see you're exploring this topic! Here's a helpful way to think about it: Start with the fundamentals and gradually build up your understanding.",
    "Excellent curiosity! This reminds me of a key principle in learning: breaking complex ideas into smaller, manageable parts always makes things clearer.",
    "I love that you're asking this! Let's approach it step by step. The best way to understand this is to connect it to what you already know.",
    "This is a common question that shows you're thinking deeply! Consider how this concept relates to other topics you've been studying.",
    "Great insight! You're on the right track. Here's another perspective that might help clarify things for you.",
    "That's exactly the kind of question that leads to deeper learning! Let's explore this together by examining the underlying patterns.",
    "I can tell you're really engaging with the material! The key to mastering this concept is understanding its practical applications.",
    "Perfect question! This concept becomes much clearer when you see how it works in real-world examples.",
    "You're asking all the right questions! The beauty of this topic is how it connects to so many other areas of knowledge.",
]

ENCOURAGEMENTS = [
    "Keep up the excellent work!",
    "You're making great progress!",
    "Your curiosity is your greatest learning tool!",
    "Remember, every expert was once a beginner!",
    "You're developing strong critical thinking skills!",
]


def generate_response(user_message: str) -> AITutorResponse:
    try:
        response = random.choice(CANNED_RESPONSES)
        encouragement = random.choice(ENCOURAGEMENTS)

        full_response = f"{response}\n\n{encouragement}"

        time.sleep(2)

        return AITutorResponse(response=full_response, success=True)
    except Exception:
        return AITutorResponse(
            response="I'm having trouble processing your question right now. Please try again!",
            success=False,
        )
