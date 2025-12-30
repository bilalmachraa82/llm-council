"""Prisma-based storage for conversations."""

from typing import List, Dict, Any, Optional
from prisma import Prisma
from prisma.models import Conversation, Message
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
        include={"messages": {"order": {"createdAt": "asc"}}}
    )
    
    if conversation is None:
        return None
    
    # Convert messages to dict format
    messages = []
    for msg in conversation.messages:
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
