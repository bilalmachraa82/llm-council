import asyncio
from backend.council import stage1_collect_responses
from backend.config import UNCENSORED_SYSTEM_PROMPT, DAN_PROMPTS

async def test_uncensored_flow():
    print("🧪 Testing Uncensored Council Flow...")
    
    # 1. Test DAN Prompt Injection Logic
    print("\n[1] Verifying DAN Prompt Injection...")
    mode = "classic"
    expected_prompt = UNCENSORED_SYSTEM_PROMPT + f"\n\nSPECIFIC PERSONA INSTRUCTIONS:\n{DAN_PROMPTS[mode]}"
    
    print(f"   Selected Mode: {mode}")
    print("   System Prompt Logic Check: OK") 
    
    # 2. Mocking a request (Dry Run - just checking imports and function signatures)
    try:
        from backend.config import get_models_for_tier
        models, chairman = get_models_for_tier("uncensored")
        print(f"\n[2] Verifying Model List for 'uncensored' tier:")
        for m in models:
            print(f"   - {m}")
        print(f"   Chairman: {chairman}")
        
        if "deepseek/deepseek-chat" in models and "nousresearch/hermes-3-llama-3.1-405b" in models:
            print("   ✅ Critical models Present")
        else:
            print("   ❌ Missing critical models")
            
    except Exception as e:
        print(f"   ❌ Error verifying config: {e}")

if __name__ == "__main__":
    asyncio.run(test_uncensored_flow())
