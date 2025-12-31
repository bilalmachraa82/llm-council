"""Prisma-based storage for conversations."""

from typing import List, Dict, Any, Optional
from prisma import Prisma
from prisma.models import Conversation, Message, User
import json

# Global Prisma client instance
_db: Optional[Prisma] = None


async def get_db() -> Prisma:
    """Get or create the Prisma client instance."""
    global _db
    if _db is None:
        _db = Prisma()
        await _db.connect()
    return _db


async def disconnect():
    """Disconnect the Prisma client."""
    global _db
    if _db is not None:
        await _db.disconnect()
        _db = None


async def create_conversation(conversation_id: str) -> Dict[str, Any]:
    """
    Create a new conversation.

    Args:
        conversation_id: Unique identifier for the conversation

    Returns:
        New conversation dict
    """
    db = await get_db()
    
    conversation = await db.conversation.create(
        data={
            "id": conversation_id,
            "title": "New Conversation"
        }
    )
    
    return {
        "id": conversation.id,
        "created_at": conversation.createdAt.isoformat(),
        "title": conversation.title,
        "messages": []
    }


async def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
    """
    Load a conversation from storage.

    Args:
        conversation_id: Unique identifier for the conversation

    Returns:
        Conversation dict or None if not found
    """
    db = await get_db()
    
    conversation = await db.conversation.find_unique(
        where={"id": conversation_id},
        include={"messages": True}
    )
    
    if conversation is None:
        return None
    
    # Sort messages by createdAt in Python (Prisma Python include doesn't support ordering)
    sorted_messages = sorted(conversation.messages, key=lambda m: m.createdAt)
    
    # Convert messages to dict format
    messages = []
    for msg in sorted_messages:
        if msg.role == "user":
            messages.append({
                "role": "user",
                "content": msg.content
            })
        else:
            messages.append({
                "role": "assistant",
                "stage1": msg.stage1,
                "stage2": msg.stage2,
                "stage3": msg.stage3
            })
    
    return {
        "id": conversation.id,
        "created_at": conversation.createdAt.isoformat(),
        "title": conversation.title,
        "messages": messages
    }


async def list_conversations() -> List[Dict[str, Any]]:
    """
    List all conversations (metadata only).

    Returns:
        List of conversation metadata dicts
    """
    db = await get_db()
    
    conversations = await db.conversation.find_many(
        order={"createdAt": "desc"},
        include={"messages": True}
    )
    
    return [
        {
            "id": conv.id,
            "created_at": conv.createdAt.isoformat(),
            "title": conv.title,
            "message_count": len(conv.messages)
        }
        for conv in conversations
    ]


async def add_user_message(conversation_id: str, content: str):
    """
    Add a user message to a conversation.

    Args:
        conversation_id: Conversation identifier
        content: User message content
    """
    db = await get_db()
    
    await db.message.create(
        data={
            "role": "user",
            "content": content,
            "conversationId": conversation_id
        }
    )


async def add_assistant_message(
    conversation_id: str,
    stage1: List[Dict[str, Any]],
    stage2: List[Dict[str, Any]],
    stage3: Dict[str, Any]
):
    """
    Add an assistant message with all 3 stages to a conversation.

    Args:
        conversation_id: Conversation identifier
        stage1: List of individual model responses
        stage2: List of model rankings
        stage3: Final synthesized response
    """
    db = await get_db()
    
    await db.message.create(
        data={
            "role": "assistant",
            "stage1": json.dumps(stage1),
            "stage2": json.dumps(stage2),
            "stage3": json.dumps(stage3),
            "conversationId": conversation_id
        }
    )


async def update_conversation_title(conversation_id: str, title: str):
    """
    Update the title of a conversation.

    Args:
        conversation_id: Conversation identifier
        title: New title for the conversation
    """
    db = await get_db()
    
    await db.conversation.update(
        where={"id": conversation_id},
        data={"title": title}
    )


# ============== User Management ==============

async def create_user(email: str, password_hash: str) -> Dict[str, Any]:
    """
    Create a new user.
    
    Args:
        email: User's email
        password_hash: Hashed password
    
    Returns:
        New user dict
    """
    db = await get_db()
    
    user = await db.user.create(
        data={
            "email": email,
            "passwordHash": password_hash,
            "credits": 10,
            "plan": "free"
        }
    )
    
    return {
        "id": user.id,
        "email": user.email,
        "credits": user.credits,
        "plan": user.plan,
        "created_at": user.createdAt.isoformat(),
    }


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get a user by email.
    
    Args:
        email: User's email
    
    Returns:
        User dict or None if not found
    """
    db = await get_db()
    
    user = await db.user.find_unique(where={"email": email})
    
    if user is None:
        return None
    
    return {
        "id": user.id,
        "email": user.email,
        "password_hash": user.passwordHash,
        "credits": user.credits,
        "plan": user.plan,
        "created_at": user.createdAt.isoformat(),
    }


async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a user by ID.
    
    Args:
        user_id: User's ID
    
    Returns:
        User dict or None if not found
    """
    db = await get_db()
    
    user = await db.user.find_unique(where={"id": user_id})
    
    if user is None:
        return None
    
    return {
        "id": user.id,
        "email": user.email,
        "credits": user.credits,
        "plan": user.plan,
        "created_at": user.createdAt.isoformat(),
    }


async def update_user_credits(user_id: str, credits: int) -> None:
    """
    Update a user's credit balance.
    
    Args:
        user_id: User's ID
        credits: New credit balance
    """
    db = await get_db()
    
    await db.user.update(
        where={"id": user_id},
        data={"credits": credits}
    )

