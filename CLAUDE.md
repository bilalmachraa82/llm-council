# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LLM Council is a 3-stage deliberation system where multiple LLMs collaboratively answer user questions. The key innovation is anonymized peer review in Stage 2, preventing models from playing favorites. The system supports multiple tiers (budget, pro, ultra, uncensored) and includes voice mode, deep research, image generation, and user authentication.

## Development Commands

### Backend (Python 3.9+)
```bash
# Install dependencies (choose one)
pip install -r requirements.txt
uv add  # if using uv (recommended)

# Database operations
cd backend
prisma generate                          # Generate Prisma client from schema
prisma db push                           # Push schema to database
prisma studio                            # Open Prisma Studio GUI

# Run backend (port 8001, NOT 8000)
python -m backend.main                   # From project root
uvicorn backend.main:app --reload        # Alternative
```

### Frontend (Node.js 18+)
```bash
cd frontend
npm install                              # Install dependencies
npm run dev                              # Start dev server (port 5173)
npm run build                            # Production build
npm run lint                             # Run ESLint
```

### Full Stack
```bash
./start.sh                               # Start both backend + frontend
```

### Testing
```bash
python test_backend_logic.py             # Test uncensored flow
python backend/diagnose_models.py        # Test model connectivity
```

## Architecture

### Backend Core Modules

**`config.py`** - Tier-based model configuration
- Four tiers: `budget` (~$0.02/query), `pro` (~$0.15/query), `ultra` (~$1.50/query), `uncensored`
- `get_models_for_tier(tier)`: Returns (council_models, chairman_model) tuple
- Contains DAN prompts for uncensored mode

**`config_pro.py`** - Named agent personas system
- `STANDARD_COUNCIL_AGENTS`: Apollo, Gemini, Sonnet, Opus, Grok
- `UNCENSORED_COUNCIL_AGENTS`: Hermes, Dolphin, Dragon, Eva, Mixtral
- `DEEP_RESEARCH_AGENTS`: Flash, Sonar, Grok, Athena, Sherlock, Hemingway
- `get_agent_by_model(model_id)`: Lookup persona by model ID
- `get_council_agents()`: Get active council based on COUNCIL_TYPE

**`council.py`** - 3-stage deliberation logic
- `stage1_collect_responses()`: Parallel queries to council models
- `stage2_collect_rankings()`: Anonymized peer review, returns (rankings, label_to_model)
- `stage3_synthesize_final()`: Chairman synthesis
- `parse_ranking_from_text()`: Extracts "FINAL RANKING:" section
- `calculate_aggregate_rankings()`: Computes average rank position

**`openrouter.py`** - LLM API client
- `query_model()`: Single async query
- `query_models_parallel()`: Parallel queries via asyncio.gather()
- Returns `{'content': str, 'reasoning_details': optional}`

**`storage_prisma.py`** - PostgreSQL storage (active)
- Replaces legacy JSON storage (`storage.py`)
- Prisma ORM with async/await
- Messages stored with JSON fields for stage1/2/3 results
- User auth, credits, password reset tokens

**`main.py`** - FastAPI application
- Serves frontend from `/` (consolidated deployment)
- Health check at `/api/health`
- CORS for localhost + Vercel + Netlify + custom domains
- Rate limiting via slowapi
- Routes: conversations, messaging (stream + audio), auth, research, images, settings

### Feature Modules

**`deep_research.py`** - Multi-stream research engine
- Velocity Stream: Gemini Flash + DDG search
- Citation Stream: Perplexity Sonar Deep Research
- Wildcard Stream: Grok
- Final consensus synthesis
- Server-Sent Events streaming

**`voice.py`** - Voice mode
- `transcribe_audio()`: Whisper STT
- `synthesize_speech()`: OpenAI TTS (Onyx voice)
- Used by `/message/audio` endpoint

**`images.py`** - Image generation
- Flux models via OpenRouter
- `generate_image(prompt)`: Returns base64 image

**`auth.py`** - JWT authentication
- `hash_password()`, `verify_password()`: bcrypt
- `create_access_token()`: JWT generation
- `get_current_user_id()`: Token validation

**`context_sharding.py`** - Token optimization
- Semantic chunking for long conversations
- 90% token savings by loading only relevant context

**`settings_store.py`** - User settings persistence
- Custom agent personas per user
- System prompt overrides

## Data Flow

```
User Query
    ↓
Stage 1: Parallel queries → [individual responses with agent metadata]
    ↓
Stage 2: Anonymize → Parallel ranking queries → [evaluations + parsed rankings]
    ↓
Aggregate Rankings → Calculate average position per response
    ↓
Stage 3: Chairman synthesis with full context
    ↓
Return: {stage1, stage2, stage3, metadata: {label_to_model, aggregate_rankings}}
    ↓
Frontend: Display with tabs + aggregate rankings + validation UI
```

## Key Design Decisions

### Consolidated Deployment
- Backend serves frontend static files from `frontend/dist/`
- Single Railway instance handles both
- Health check at `/api/health`, app at `/`
- Simplifies CORS, reduces infrastructure

### Anonymization Strategy
- Stage 2: Models receive "Response A, B, C..." labels
- Backend creates `label_to_model` mapping
- Frontend de-anonymizes for display (bold model names)
- Prevents bias while maintaining transparency

### Error Handling
- Graceful degradation: continues with successful responses
- Never fails entire request due to single model failure
- Logs errors but doesn't expose to user unless all fail

### Agent Personas System
- Each council member has: name, title, emoji, avatar, expertise, personality
- Configurable via UI (stored per-user in database)
- Falls back to defaults for unauthenticated users

## Important Implementation Details

### Relative Imports
All backend modules use relative imports (`from .config import ...`).
**Critical**: Run backend as `python -m backend.main` from project root, NOT from backend directory.

### Port Configuration
- Backend: 8001 (changed from 8000 to avoid conflict)
- Frontend: 5173 (Vite default)
- Update both `backend/main.py` and `frontend/src/api.js` if changing.

### Markdown Rendering
All ReactMarkdown components must be wrapped in `<div className="markdown-content">` for proper spacing (defined in `index.css`).

### Model Configuration
- Models defined in `backend/config.py` (tier-based lists)
- Agent personas in `backend/config_pro.py`
- COUNCIL_TYPE env var switches between STANDARD/UNCENSORED

### CORS Configuration
Origins include localhost:5173, localhost:3000, plus explicit production URLs and regex patterns for Vercel/Netlify.

## Common Gotchas

1. **Module Import Errors**: Run as `python -m backend.main` from project root
2. **CORS Issues**: Frontend URL must be in allowed origins list
3. **Ranking Parse Failures**: Fallback regex extracts "Response X" patterns
4. **Missing Metadata**: Only in API responses, NOT in legacy JSON storage
5. **Database**: Run `prisma generate` after schema changes
6. **Frontend Build**: Required for consolidated deployment (`npm run build`)

## Environment Variables (.env)

```bash
# Required
OPENROUTER_API_KEY=sk-or-v1-...
DATABASE_URL=postgresql://...  # Neon or local Postgres

# Optional
COUNCIL_MODE=pro               # budget | pro | ultra
OPENAI_API_KEY=sk-...          # For voice features
PERPLEXITY_API_KEY=            # For deep research
JWT_SECRET=                    # For auth (generated if missing)
FRONTEND_URL=                  # For password reset links
CORS_ORIGINS=                  # Comma-separated additional origins
```
