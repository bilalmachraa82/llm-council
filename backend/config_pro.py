"""Configuration for the LLM Council - PRO (Premium)."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - PRO configuration (~$45/query)
COUNCIL_MODELS = [
    "openai/gpt-5.1",                # $1.25/$10.00 - Latest GPT
    "google/gemini-3-pro",           # $2.00/$12.00 - Gemini 3 Pro
    "anthropic/claude-sonnet-4.5",   # $3.00/$15.00 - Claude Sonnet
    "anthropic/claude-opus-4.5",     # $5.00/$25.00 - Most advanced Claude
    "x-ai/grok-4",                   # $3.00/$15.00 - Latest Grok
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = "anthropic/claude-opus-4.5"  # Best reasoning for synthesis

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"
