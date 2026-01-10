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


async def create_conversation(conversation_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a new conversation.

    Args:
        conversation_id: Unique identifier for the conversation
        user_id: Optional user ID for user-scoped conversations

    Returns:
        New conversation dict
    """
    db = await get_db()

    data = {
        "id": conversation_id,
        "title": "New Conversation"
    }
    if user_id:
        data["userId"] = user_id

    conversation = await db.conversation.create(data=data)

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
            assistant_msg = {
                "role": "assistant",
                "stage1": msg.stage1,
                "stage2": msg.stage2,
                "stage3": msg.stage3,
            }
            # Include metadata if available
            if msg.labelToModel is not None:
                assistant_msg["label_to_model"] = msg.labelToModel
            if msg.aggregateRankings is not None:
                assistant_msg["aggregate_rankings"] = msg.aggregateRankings
            messages.append(assistant_msg)

    return {
        "id": conversation.id,
        "created_at": conversation.createdAt.isoformat(),
        "title": conversation.title,
        "messages": messages
    }


async def list_conversations(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    List all conversations (metadata only).
    If user_id is provided, only return that user's conversations.

    Args:
        user_id: Optional user ID to filter conversations

    Returns:
        List of conversation metadata dicts
    """
    db = await get_db()

    where_clause = {}
    if user_id:
        where_clause["userId"] = user_id

    conversations = await db.conversation.find_many(
        where=where_clause or None,
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
    stage3: Dict[str, Any],
    label_to_model: Optional[Dict[str, str]] = None,
    aggregate_rankings: Optional[List[Dict[str, Any]]] = None
):
    """
    Add an assistant message with all 3 stages to a conversation.

    Args:
        conversation_id: Conversation identifier
        stage1: List of individual model responses
        stage2: List of model rankings
        stage3: Final synthesized response
        label_to_model: Optional metadata mapping anonymous labels to models
        aggregate_rankings: Optional metadata with calculated rankings
    """
    db = await get_db()

    data = {
        "role": "assistant",
        "stage1": json.dumps(stage1),
        "stage2": json.dumps(stage2),
        "stage3": json.dumps(stage3),
        "conversationId": conversation_id
    }

    if label_to_model is not None:
        data["labelToModel"] = json.dumps(label_to_model)
    if aggregate_rankings is not None:
        data["aggregateRankings"] = json.dumps(aggregate_rankings)

    await db.message.create(data=data)


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


async def verify_conversation_access(conversation_id: str, user_id: str) -> bool:
    """
    Verify that a user has access to a conversation.
    A user has access if the conversation belongs to them or has no owner (public/legacy).

    Args:
        conversation_id: Conversation identifier
        user_id: User ID to check access for

    Returns:
        True if user has access, False otherwise
    """
    db = await get_db()

    conversation = await db.conversation.find_unique(
        where={"id": conversation_id},
        select={"userId": True}
    )

    if conversation is None:
        return False

    # User has access if conversation has no owner (legacy/public) or belongs to them
    return conversation.userId is None or conversation.userId == user_id


async def save_reset_token(user_id: str, token_hash: str, expires_at: "datetime") -> None:
    """Save a password reset token."""
    db = await get_db()
    # Delete any existing tokens for this user first
    await db.resettoken.delete_many(where={"userId": user_id})
    
    await db.resettoken.create(data={
        "userId": user_id,
        "token": token_hash,
        "expiresAt": expires_at
    })

async def get_reset_token(token_hash: str) -> Optional[Dict[str, Any]]:
    """Find a reset token by its hash."""
    db = await get_db()
    token = await db.resettoken.find_unique(
        where={"token": token_hash},
        include={"user": True}
    )
    if not token:
        return None
    
    return {
        "userId": token.userId,
        "expiresAt": token.expiresAt,
        "user_email": token.user.email
    }

async def delete_reset_token(token_hash: str) -> None:
    """Delete a used token."""
    db = await get_db()
    await db.resettoken.delete(where={"token": token_hash})

async def update_user_password(user_id: str, password_hash: str) -> None:
    """Update user password."""
    db = await get_db()
    await db.user.update(
        where={"id": user_id},
        data={"passwordHash": password_hash}
    )

