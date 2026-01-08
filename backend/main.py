"""FastAPI backend for LLM Council."""

import os
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from typing import List, Dict, Any, Optional
import uuid
import json
import asyncio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from . import storage_prisma as storage
from . import voice
from . import auth
from .council import run_full_council, generate_conversation_title, stage1_collect_responses, stage2_collect_rankings, stage3_synthesize_final, calculate_aggregate_rankings
from .deep_research import run_deep_research
from .images import generate_image

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="LLM Council API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS origins from environment or defaults
base_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://llm-council-frontend.vercel.app",
    "https://llm-council.aiparati.pt",
    "https://ll-council.aiparati.pt",
    "https://llm-council-aiparati.vercel.app",
    "https://llm-council-git-main-bilalmachraa82s-projects.vercel.app",
    "https://llm-council-neon.vercel.app",
]

env_origins = os.getenv("CORS_ORIGINS", "")
if env_origins:
    base_origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

# Use a set to deduplicate, then convert back to list
origins = list(set(base_origins))

# Regex pattern to match all Vercel preview deployments
import re
vercel_pattern = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use explicit list instead of wildcard
    allow_origin_regex=vercel_pattern,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CreateConversationRequest(BaseModel):
    """Request to create a new conversation."""
    pass


class SendMessageRequest(BaseModel):
    """Request to send a message in a conversation."""
    content: str
    tier: str = "pro"  # "pro" or "budget"
    dan_mode: Optional[str] = None  # Specific DAN persona key (e.g., "classic", "machiavelli")

    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate content length and sanitize."""
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        if len(v) > 10000:
            raise ValueError('Content cannot exceed 10000 characters')
        return v.strip()

    @field_validator('tier')
    @classmethod
    def validate_tier(cls, v: str) -> str:
        """Validate tier is one of the allowed values."""
        allowed_tiers = {"pro", "budget", "uncensored"}
        if v not in allowed_tiers:
            raise ValueError(f'Tier must be one of: {", ".join(allowed_tiers)}')
        return v


class ImageGenerationRequest(BaseModel):
    """Request to generate an image."""
    prompt: str

    @field_validator('prompt')
    @classmethod
    def validate_prompt(cls, v: str) -> str:
        """Validate prompt length."""
        if not v or not v.strip():
            raise ValueError('Prompt cannot be empty')
        if len(v) > 1000:
            raise ValueError('Prompt cannot exceed 1000 characters')
        return v.strip()


class ConversationMetadata(BaseModel):
    """Conversation metadata for list view."""
    id: str
    created_at: str
    title: str
    message_count: int


class Conversation(BaseModel):
    """Full conversation with all messages."""
    id: str
    created_at: str
    title: str
    messages: List[Dict[str, Any]]


# Auth request/response models
class RegisterRequest(BaseModel):
    email: str
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        # Check for at least one letter and one number
        has_letter = any(c.isalpha() for c in v)
        has_digit = any(c.isdigit() for c in v)
        if not (has_letter and has_digit):
            raise ValueError('Password must contain both letters and numbers')
        return v


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: Dict[str, Any]


class UserResponse(BaseModel):
    id: str
    email: str
    credits: int
    plan: str


# ============== Helper Functions ==============

def validate_uuid(uuid_string: str) -> bool:
    """Validate that a string is a valid UUID."""
    try:
        uuid.UUID(uuid_string)
        return True
    except ValueError:
        return False


async def get_optional_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Dependency to get user_id from Authorization header if present.
    Returns None for unauthenticated requests (for backwards compatibility).
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    return await auth.get_current_user_id(authorization)


async def require_auth(authorization: Optional[str] = Header(None)) -> str:
    """
    Dependency that requires authentication.
    Raises HTTPException if not authenticated.
    """
    user_id = await auth.get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return user_id


@app.post("/auth/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """Register a new user."""
    # Check if user already exists
    existing = await storage.get_user_by_email(request.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    password_hash = auth.hash_password(request.password)
    user = await storage.create_user(request.email, password_hash)
    
    # Generate token
    token = auth.create_access_token(user["id"], user["email"])
    
    return {"token": token, "user": user}


@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Login an existing user."""
    user = await storage.get_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not auth.verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate token
    token = auth.create_access_token(user["id"], user["email"])
    
    # Remove password_hash from response
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    
    return {"token": token, "user": user_response}


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get the current authenticated user."""
    user_id = await auth.get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = await storage.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "email": user["email"],
        "credits": user["credits"],
        "plan": user["plan"],
    }


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "LLM Council API"}


@app.get("/api/debug/routes")
async def debug_routes():
    """List all registered routes for debugging."""
    return [{"path": route.path, "name": route.name, "methods": list(route.methods)} for route in app.routes]


@app.get("/api/conversations", response_model=List[ConversationMetadata])
@limiter.limit("60/minute")
async def list_conversations(
    request,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """List all conversations (metadata only) - scoped to user if authenticated."""
    return await storage.list_conversations(user_id=user_id)


@app.post("/api/conversations", response_model=Conversation)
@limiter.limit("20/minute")
async def create_conversation(
    request,
    req: CreateConversationRequest,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """Create a new conversation - associates with user if authenticated."""
    conversation_id = str(uuid.uuid4())
    conversation = await storage.create_conversation(conversation_id, user_id=user_id)
    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
@limiter.limit("60/minute")
async def get_conversation(
    request,
    conversation_id: str,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """Get a specific conversation with all its messages."""
    if not validate_uuid(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")

    conversation = await storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # If user is authenticated, check access
    if user_id and not await storage.verify_conversation_access(conversation_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied")

    return conversation


@app.post("/api/conversations/{conversation_id}/message")
@limiter.limit("10/minute")
async def send_message(
    request,
    conversation_id: str,
    req: SendMessageRequest,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Send a message and run the 3-stage council process.
    Returns the complete response with all stages.
    """
    if not validate_uuid(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")

    # Check if conversation exists
    db_conversation = await storage.get_conversation(conversation_id)
    if db_conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # If user is authenticated, check access
    if user_id and not await storage.verify_conversation_access(conversation_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if this is the first message
    is_first_message = len(db_conversation["messages"]) == 0

    # Add user message
    await storage.add_user_message(conversation_id, req.content)

    # If this is the first message, generate a title
    if is_first_message:
        title = await generate_conversation_title(req.content)
        await storage.update_conversation_title(conversation_id, title)

    # Run the 3-stage council process
    stage1_results, stage2_results, stage3_result, metadata = await run_full_council(
        req.content,
        tier=req.tier,
        dan_mode=req.dan_mode
    )

    # Add assistant message with all stages AND metadata
    await storage.add_assistant_message(
        conversation_id,
        stage1_results,
        stage2_results,
        stage3_result,
        label_to_model=metadata.get("label_to_model"),
        aggregate_rankings=metadata.get("aggregate_rankings")
    )

    # Return the complete response with metadata
    return {
        "stage1": stage1_results,
        "stage2": stage2_results,
        "stage3": stage3_result,
        "metadata": metadata
    }


@app.post("/api/conversations/{conversation_id}/message/stream")
@limiter.limit("10/minute")
async def send_message_stream(
    request,
    conversation_id: str,
    req: SendMessageRequest,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Send a message and stream the 3-stage council process.
    Returns Server-Sent Events as each stage completes.
    """
    if not validate_uuid(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")

    # Check if conversation exists
    db_conversation = await storage.get_conversation(conversation_id)
    if db_conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # If user is authenticated, check access
    if user_id and not await storage.verify_conversation_access(conversation_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if this is the first message
    is_first_message = len(db_conversation["messages"]) == 0

    async def event_generator():
        try:
            # Add user message
            await storage.add_user_message(conversation_id, req.content)

            # Start title generation in parallel (don't await yet)
            title_task = None
            if is_first_message:
                title_task = asyncio.create_task(generate_conversation_title(req.content))

            # Stage 1: Collect responses
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(req.content, req.tier, req.dan_mode)
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            # Stage 2: Collect rankings
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(req.content, stage1_results, req.tier)
            aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

            # Stage 3: Synthesize final answer
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(req.content, stage1_results, stage2_results, req.tier)
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

            # Wait for title generation if it was started (with error handling)
            if title_task:
                try:
                    title = await title_task
                    await storage.update_conversation_title(conversation_id, title)
                    yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"
                except Exception:
                    # Don't fail the whole request if title generation fails
                    pass

            # Save complete assistant message with metadata
            await storage.add_assistant_message(
                conversation_id,
                stage1_results,
                stage2_results,
                stage3_result,
                label_to_model=label_to_model,
                aggregate_rankings=aggregate_rankings
            )

            # Send completion event
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            # Send error event
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/api/conversations/{conversation_id}/message/audio")
@limiter.limit("10/minute")
async def send_audio_message(
    request,
    conversation_id: str,
    audio: UploadFile = File(...),
    tier: str = "pro",
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Receive audio, transcribe it, run council, and stream back events + TTS audio.
    """
    if not validate_uuid(conversation_id):
        raise HTTPException(status_code=400, detail="Invalid conversation ID format")

    # Check conversation
    db_conversation = await storage.get_conversation(conversation_id)
    if db_conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # If user is authenticated, check access
    if user_id and not await storage.verify_conversation_access(conversation_id, user_id):
        raise HTTPException(status_code=403, detail="Access denied")

    # Save temp audio file
    temp_filename = f"temp_{uuid.uuid4()}.webm"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(audio.file, buffer)

    try:
        # Transcribe
        transcription = await voice.transcribe_audio(temp_filename)
    finally:
        # Cleanup input audio
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

    # Re-use the existing stream logic, but wrapped to handle the transcription
    # We will yield an initial event with the transcription so frontend can display it

    is_first_message = len(db_conversation["messages"]) == 0

    async def event_generator():
        try:
            # Send transcription event first
            yield f"data: {json.dumps({'type': 'transcription', 'text': transcription})}\n\n"

            # Add user message
            await storage.add_user_message(conversation_id, transcription)

            # Start title generation
            title_task = None
            if is_first_message:
                title_task = asyncio.create_task(generate_conversation_title(transcription))

            # Stage 1
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(transcription, tier)
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            # Stage 2
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(transcription, stage1_results, tier)
            aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

            # Stage 3
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(transcription, stage1_results, stage2_results, tier)

            # Generate TTS Audio for the final response
            tts_filename = f"response_{uuid.uuid4()}.mp3"
            audio_url = None
            try:
                await voice.synthesize_speech(stage3_result["response"], tts_filename)

                with open(tts_filename, "rb") as f:
                    audio_data = f.read()
                    import base64
                    audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                    audio_url = f"data:audio/mp3;base64,{audio_base64}"
            except Exception:
                # Don't fail the whole request if TTS fails
                pass
            finally:
                if os.path.exists(tts_filename):
                    os.remove(tts_filename)

            # Attach audio to the stage3 complete event
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result, 'audio': audio_url})}\n\n"

            # Title update with error handling
            if title_task:
                try:
                    title = await title_task
                    await storage.update_conversation_title(conversation_id, title)
                    yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"
                except Exception:
                    pass

            # Save assistant message with metadata
            await storage.add_assistant_message(
                conversation_id,
                stage1_results,
                stage2_results,
                stage3_result,
                label_to_model=label_to_model,
                aggregate_rankings=aggregate_rankings
            )

            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/api/generate-image")
@limiter.limit("20/minute")
async def api_generate_image(
    request,
    req: ImageGenerationRequest,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """Generate an image using Flux via OpenRouter."""
    result = await generate_image(req.prompt)
    if not result:
        raise HTTPException(status_code=500, detail="Image generation failed")
    return result


@app.post("/api/deep-research/stream")
@limiter.limit("5/minute")
async def api_deep_research_stream(
    request,
    req: ImageGenerationRequest,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Run Deep Research workflow.
    """
    prompt = req.prompt

    async def event_generator():
        try:
            async for update in run_deep_research(prompt):
                yield f"data: {json.dumps(update)}\n\n"

            yield f"data: {json.dumps({'type': 'complete'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
