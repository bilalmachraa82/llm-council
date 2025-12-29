"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council mode: "budget" (~$2), "pro" (~$40), or "ultra" (~$180)
COUNCIL_MODE = os.getenv("COUNCIL_MODE", "pro").lower()

if COUNCIL_MODE == "budget":
    # LOW-COST: Best REASONING open-source models (Dec 2025)
    # Based on GPQA Diamond + AIME benchmarks (NOT coding)
    COUNCIL_MODELS = [
        "z-ai/glm-4.7",                  # 85.7% GPQA, 95.7% AIME - #1 Open-Source Reasoning
        "deepseek/deepseek-v3.2-thinking", # 82.4% GPQA, 93.1% AIME - GPT-5 class
        "alibaba/qwen3-235b-a22b-thinking-2507", # 81.1% GPQA, 92.3% AIME
        "deepseek/deepseek-r1-0528",     # 80% GPQA - OpenAI o1 rival
        "z-ai/glm-4.6",                  # 81.0% GPQA, 93.9% AIME - Strong backup
    ]
    CHAIRMAN_MODEL = "z-ai/glm-4.7"  # Best reasoning in open-source (85.7% GPQA)
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
    # PRO: Premium models (default) - Based on LM Arena + HLE Dec 2025
    COUNCIL_MODELS = [
        "google/gemini-3-pro-preview",   # #1 LM Arena (1492 Elo), #1 HLE (37.5%)
        "x-ai/grok-4.1-fast",            # #2 LM Arena (1482 Elo), #1 HLE Heavy (44%)
        "anthropic/claude-opus-4.5",     # #1 WebDev, Premium reasoning
        "openai/gpt-5.2",                # Strong all-rounder
        "alibaba/qwen3-max",             # #1 Agentic SOTA (replaces Llama 4)
    ]
    CHAIRMAN_MODEL = "google/gemini-3-pro-preview"  # Best overall benchmark performance

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"

