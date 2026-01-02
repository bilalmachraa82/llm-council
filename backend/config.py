"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council mode: "budget" (~$2), "pro" (~$40), or "ultra" (~$180)
COUNCIL_MODE = os.getenv("COUNCIL_MODE", "pro").lower()

if COUNCIL_MODE == "budget":
    # BUDGET: Smartest LOW-COST models (Dec 2025)
    # Best intelligence per dollar spent
    COUNCIL_MODELS = [
        "deepseek/deepseek-v3.2-thinking",   # $0.28/M - Best coding value
        "google/gemini-2.5-flash",            # ~$0.10/M - 1M context, fast
        "meta-llama/llama-4-maverick:free",   # FREE - 400B params, strong benchmarks
        "anthropic/claude-3.5-haiku",         # $0.80/M - Great value reasoning
        "openai/gpt-5-nano",                  # $0.05/M - Cheapest GPT-5 variant
    ]
    CHAIRMAN_MODEL = "deepseek/deepseek-v3.2-thinking"  # Best value reasoning
elif COUNCIL_MODE == "ultra":
    # ULTRA: Highest intelligence models globally (Dec 2025)
    COUNCIL_MODELS = [
        "openai/gpt-5.2-high",           # #1 OpenAI - 92.4% GPQA
        "anthropic/claude-opus-4.5-thinking", # #1 WebDev Arena (1519)
        "google/gemini-3-pro",           # #1 LM Arena (1492), 45.8% HLE
        "x-ai/grok-4.1-thinking",        # 100% AIME, strong reasoning
        "z-ai/glm-4.7",                  # 85.7% GPQA - top Chinese model
    ]
    CHAIRMAN_MODEL = "openai/gpt-5.2-high"
else:
    # PRO (Premium): THE 5 SMARTEST AI MODELS IN THE WORLD (Dec 2025)
    # Pure intelligence ranking based on benchmarks
    COUNCIL_MODELS = [
        "openai/gpt-5.2",                # #1 GPQA (92.4%), 100% AIME
        "google/gemini-3-pro-preview",   # #1 LM Arena (1492), #1 HLE (45.8%)
        "anthropic/claude-opus-4.5-thinking", # #1 WebDev Arena (1519)
        "x-ai/grok-4.1-thinking",        # #3 LM Arena (1477), 100% AIME Heavy
        "z-ai/glm-4.7",                  # 85.7% GPQA - best Chinese reasoning
    ]
    CHAIRMAN_MODEL = "openai/gpt-5.2"  # Highest GPQA score

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"


def get_models_for_tier(tier: str) -> tuple:
    """
    Get council models and chairman model for a specific tier.
    
    Args:
        tier: "pro", "budget", or "ultra"
    
    Returns:
        Tuple of (council_models, chairman_model)
    """
    if tier == "budget":
        return (
            [
                "deepseek/deepseek-v3.2-thinking",
                "google/gemini-2.5-flash",
                "meta-llama/llama-4-maverick:free",
                "anthropic/claude-3.5-haiku",
                "openai/gpt-5-nano",
            ],
            "deepseek/deepseek-v3.2-thinking"
        )
    elif tier == "ultra":
        return (
            [
                "openai/gpt-5.2-high",
                "anthropic/claude-opus-4.5-thinking",
                "google/gemini-3-pro",
                "x-ai/grok-4.1-thinking",
                "z-ai/glm-4.7",
            ],
            "openai/gpt-5.2-high"
        )
    else:  # pro (default) - THE 5 SMARTEST
        return (
            [
                "openai/gpt-5.2",
                "google/gemini-3-pro-preview",
                "anthropic/claude-opus-4.5-thinking",
                "x-ai/grok-4.1-thinking",
                "z-ai/glm-4.7",
            ],
            "openai/gpt-5.2"
        )
