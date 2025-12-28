"""Configuration for the LLM Council - BUDGET (Económico)."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - BUDGET configuration (~$2/query)
COUNCIL_MODELS = [
    "openai/gpt-4o-mini",            # $0.15/$0.60 - Fast & cheap
    "google/gemini-2.5-flash-lite",  # $0.10/$0.40 - Fastest, cheapest
    "anthropic/claude-3-haiku",       # $0.25/$1.25 - Great value
    "x-ai/grok-3-fast",               # $0.30/$1.50 - Fast Grok
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = "google/gemini-2.5-flash"  # Good balance of speed/cost

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"
