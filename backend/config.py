"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council mode: "budget" (~$2), "pro" (~$40), or "ultra" (~$180)
COUNCIL_MODE = os.getenv("COUNCIL_MODE", "pro").lower()

if COUNCIL_MODE == "budget":
    # BUDGET: Fast & cheap models
    COUNCIL_MODELS = [
        "openai/gpt-4o-mini",
        "google/gemini-2.5-flash-lite",
        "anthropic/claude-3-haiku",
        "x-ai/grok-3-fast",
    ]
    CHAIRMAN_MODEL = "google/gemini-2.5-flash"
elif COUNCIL_MODE == "ultra":
    # ULTRA: Highest intelligence models globally (Dec 2025)
    COUNCIL_MODELS = [
        "openai/gpt-5.2-high",           # #1 OpenAI reasoning
        "anthropic/claude-opus-4.5-thinking", # #1 LM Arena WebDev
        "google/gemini-3-pro",           # SOTA Multimodal
        "alibaba/qwen3-max",             # #1 Chinese Model / Agentic SOTA
        "deepseek/deepseek-v3.2-speciale",# SOTA Open-source reasoning
    ]
    CHAIRMAN_MODEL = "openai/gpt-5.2-high"
else:
    # PRO: Premium models (default)
    COUNCIL_MODELS = [
        "openai/gpt-5.2",
        "google/gemini-3-pro-preview",
        "anthropic/claude-opus-4.5",
        "x-ai/grok-4",
        "meta-llama/llama-4-405b-instruct",
    ]
    CHAIRMAN_MODEL = "openai/gpt-5.2"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"

