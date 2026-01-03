
import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv(".env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

MODELS_TO_TEST = [
    "openai/gpt-4o",
    "google/gemini-1.5-pro",
    "anthropic/claude-3.5-sonnet",
    "meta-llama/llama-3.1-405b-instruct",
    "deepseek/deepseek-chat",
]

async def test_model(model):
    print(f"Testing {model}...")
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "LLM Council Diagnostic"
    }
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 5
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                print(f"✅ {model}: OK")
                return True
            else:
                print(f"❌ {model}: Failed ({response.status_code})")
                print(f"   Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ {model}: Error ({str(e)})")
        return False

async def main():
    if not OPENROUTER_API_KEY:
        print("❌ Error: OPENROUTER_API_KEY not found in environment")
        return

    print(f"Checking {len(MODELS_TO_TEST)} models...\n")
    
    results = await asyncio.gather(*[test_model(m) for m in MODELS_TO_TEST])
    
    passed = sum(results)
    print(f"\nSummary: {passed}/{len(MODELS_TO_TEST)} models passed.")

if __name__ == "__main__":
    asyncio.run(main())
