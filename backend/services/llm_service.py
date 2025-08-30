from openai import OpenAI

# Create client once
client = OpenAI()

def generate_dynamic_answer(user_msg, history, location=None):
    """
    Sends user query + history to LLM to generate dynamic answer
    with follow-up questions (ChatGPT-style).
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are a Dog Health AI assistant. "
                "Provide expert, friendly, and contextual advice about dog health, nutrition, and care. "
                "Always try to engage with follow-up questions if useful."
            )
        }
    ]
    
    # Add recent chat history (last 6 messages for context)
    for chat in history[-6:]:
        # By now roles are guaranteed safe (user/assistant/system)
        messages.append({"role": chat["role"], "content": chat["text"]})

    # Add user query (with optional location context)
    user_content = user_msg
    if location:
        user_content += f"\n(Location: {location})"
    messages.append({"role": "user", "content": user_content})

    # Call OpenAI API (new syntax for v1.0+)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.7,
    )

    return response.choices[0].message.content
