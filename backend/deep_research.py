"""
Deep Research Council 2.0 - Multi-Mind Consensus Engine (2026 Frontier).
Combines Gemini 3 Flash (Velocity), Perplexity Sonar Deep Research (Citation), and Grok 4.1 (Wildcard).
"""

import asyncio
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

# API Clients
from openai import AsyncOpenAI
from duckduckgo_search import DDGS  # Fallback/Supplemental

# Internal
from .openrouter import query_model
from .config_pro import (
    DEEP_RESEARCH_MODELS, 
    PERPLEXITY_API_KEY, 
    OPENROUTER_API_KEY
)

# -----------------------------------------------------------------------------
# 1. Search Stream Implementation
# -----------------------------------------------------------------------------

async def search_velocity_gemini(query: str) -> Dict[str, Any]:
    """
    STREAM A: The Velocity Engine (Gemini 3 Flash)
    Uses DDGS for grounding + Gemini 3 Flash for massive context synthesis.
    """
    print(f"🚀 [Stream A] Velocity (Gemini 3 Flash) engaging for: {query}")
    
    # 1. Raw Search (Grounding)
    raw_results = []
    try:
        def run_ddg():
            with DDGS() as ddgs:
                return list(ddgs.text(query, max_results=8))
        
        search_hits = await asyncio.to_thread(run_ddg)
        raw_results = [f"Title: {h['title']}\nURL: {h['href']}\nSnippet: {h['body']}" for h in search_hits]
    except Exception as e:
        raw_results = [f"Search Error: {str(e)}"]

    # 2. Synthesis
    context = "\n\n".join(raw_results)
    prompt = f"""You are the VELOCITY ENGINE.
    Query: {query}
    
    Raw Search Data:
    {context}
    
    Task: deeply analyze this data.
    - Provide specific details, dates, and numbers.
    - Synthesize a comprehensive answer.
    """
    
    try:
        resp = await query_model(DEEP_RESEARCH_MODELS["velocity_search"], [
            {"role": "system", "content": "You are a high-speed research engine. Be verbose and detailed."},
            {"role": "user", "content": prompt}
        ])
        content = resp['content']
    except Exception as e:
        content = f"Velocity Engine Failed: {str(e)}"

    return {
        "stream": "Velocity (Gemini Flash)",
        "content": content,
        "raw_sources": search_hits if 'search_hits' in locals() else []
    }

async def search_citation_perplexity(query: str) -> Dict[str, Any]:
    """
    STREAM B: The Citation Engine (Perplexity Sonar Deep Research)
    """
    print(f"📚 [Stream B] Citation (Perplexity Sonar Deep) engaging for: {query}")
    
    if not PERPLEXITY_API_KEY:
        return {
            "stream": "Citation (Perplexity)",
            "content": "⚠️ SKIPPED: Missing PERPLEXITY_API_KEY in .env",
            "raw_sources": []
        }

    try:
        client = AsyncOpenAI(api_key=PERPLEXITY_API_KEY, base_url="https://api.perplexity.ai")
        
        response = await client.chat.completions.create(
            model=DEEP_RESEARCH_MODELS["citation_search"], # sonar-reasoning-pro
            messages=[
                {"role": "system", "content": "You are a precise academic researcher. Cite every claim."},
                {"role": "user", "content": query}
            ]
        )
        
        content = response.choices[0].message.content
        # Perplexity provides citations in 'citations' field usually, but OpenAI sdk might abstract it.
        # We rely on inline citations in the text or extra fields if accessible.
        # For now, we take the content which is usually rich in citations.
        
        return {
            "stream": "Citation (Perplexity)",
            "content": content,
            "raw_sources": [] # Perplexity handles its own sourcing
        }
    except Exception as e:
        print(f"❌ Perplexity Error: {e}")
        return {
            "stream": "Citation (Perplexity)",
            "content": f"Error accessing Perplexity: {str(e)}",
            "raw_sources": []
        }

async def search_wildcard_grok(query: str) -> Dict[str, Any]:
    """
    STREAM C: The Wildcard (Grok 4.1 Fast via OpenRouter)
    """
    print(f"⚡ [Stream C] Wildcard (Grok 4.1) engaging for: {query}")
    
    try:
        # Use OpenRouter via our existing query_model wrapper
        response = await query_model(DEEP_RESEARCH_MODELS["wildcard_search"], [
            {"role": "system", "content": "You are a 'Wildcard' researcher. Look for alternative perspectives, 'street knowledge', and counter-narratives that mainstream search might bury. Be bold."},
            {"role": "user", "content": query}
        ])
        
        return {
            "stream": "Wildcard (Grok)",
            "content": response['content'],
            "raw_sources": [] # Grok via OpenRouter might not return sources explicitly unless prompted, but the model has internet access.
        }
    except Exception as e:
         print(f"❌ Grok Error: {e}")
         return {
            "stream": "Wildcard (Grok)",
            "content": f"Error accessing Grok: {str(e)}",
            "raw_sources": []
        }

# -----------------------------------------------------------------------------
# 2. Agent Prompts
# -----------------------------------------------------------------------------

AGENTS = {
    # 1. LEAD RESEARCHER
    "lead": {
        "model": DEEP_RESEARCH_MODELS["lead"],
        "system": """You are the STRATEGIC PLANNER (Lead Researcher).
        Your goal is to formulate ONE master research query that will be fed to 3 completely different AI systems (Gemini, Perplexity, Grok).
        
        The query should be specific, comprehensive, and designed to elicit hard facts + nuanced perspectives.
        
        Output strictly a JSON object: {"query": "The optimized search query string"}"""
    },

    # 4. THE SKEPTIC (Conflict Resolution)
    "skeptic": {
        "model": DEEP_RESEARCH_MODELS["skeptic"],
        "system": """You are THE SKEPTIC. Your job is CONFLICT RESOLUTION.
        You have reports from 3 distinct sources:
        1. Velocity (Gemini) - Broad, fast.
        2. Citation (Perplexity) - Academic/Fact-heavy.
        3. Wildcard (Grok) - Alternative/Real-time.
        
        COMPARE AND CONTRAST.
        - Where do they agree? (Likely Truth)
        - Where do they disagree on numbers/dates? (Flag for verification)
        - Did Grok find a perspective the others missed?
        
        Output a 'Skeptic's Audit':
        - 🟢 CONSENSUS: [Points of agreement]
        - 🔴 CONFLICT: [Discrepancies found]
        - 🟡 UNIQUE SIGNAL: [Unique insight from one source]"""
    },

    # 5. CHIEF EDITOR
    "editor": {
        "model": DEEP_RESEARCH_MODELS["editor"],
        "system": """You are the CHIEF EDITOR. Synthesize the Final Council Report.
        
        Structure:
        # [Title]
        
        > **Council Consensus:** [Quick summary of what all agents agree on]
        
        ## 1. The Hard Data (Perplexity/Gemini)
        (Numbers, tables, facts)
        
        ## 2. The Alternative View (Grok)
        (Cultural context, counter-narratives, real-time sentiment)
        
        ## 3. Skeptic's Note
        (Warnings about conflicts or unverified claims)
        
        ## 4. Final Strategic Conclusion
        
        Sources:
        [Integrate source links provided in the context]
        """
    }
}

# -----------------------------------------------------------------------------
# 3. Orchestration Logic
# -----------------------------------------------------------------------------

async def run_deep_research(user_query: str):
    """
    Generator that yields status updates and final result of the Multi-Mind workflow.
    """
    start_time = datetime.now()
    
    # --- PHASE 1: PLANNING ---
    yield {"type": "status", "msg": "🧠 Lead Researcher: Strategizing for the Council..."}
    
    lead_resp = await query_model(AGENTS["lead"]["model"], [
        {"role": "system", "content": AGENTS["lead"]["system"]},
        {"role": "user", "content": f"User Request: {user_query}"}
    ])
    
    try:
        content = lead_resp['content'].replace('```json', '').replace('```', '')
        plan = json.loads(content)
        optimized_query = plan.get("query", user_query)
    except:
        optimized_query = user_query

    yield {"type": "status", "msg": f"⚔️ Council Activated. Query: '{optimized_query}'"}

    # --- PHASE 2: THE PARALLEL SEARCH (THE COUNCIL) ---
    yield {"type": "status", "msg": "⚡ Launching Parallel Streams: Gemini 3 Flash • Perplexity Deep • Grok 4.1..."}
    
    # Execute all 3 in parallel
    tasks = [
        search_velocity_gemini(optimized_query),
        search_citation_perplexity(optimized_query),
        search_wildcard_grok(optimized_query)
    ]
    
    results = await asyncio.gather(*tasks)
    
    # Unpack
    gemini_res, perplexity_res, grok_res = results
    
    # Collect all raw sources for the UI
    all_raw_sources = []
    if gemini_res.get('raw_sources'):
        # Parse DDG objects or strings
        for s in gemini_res['raw_sources']:
            if isinstance(s, dict):
                all_raw_sources.append(s)
            # If string, we can't easily make it a clickable source object without parsing, skipping for now
    
    # --- PHASE 3: THE SKEPTIC ---
    yield {"type": "status", "msg": "🛡️ The Skeptic: Arbitrating conflicts between models..."}
    
    council_context = f"""
    === REPORT A: VELOCITY (Gemini) ===
    {gemini_res['content']}
    
    === REPORT B: CITATION (Perplexity) ===
    {perplexity_res['content']}
    
    === REPORT C: WILDCARD (Grok) ===
    {grok_res['content']}
    """
    
    skeptic_resp = await query_model(AGENTS["skeptic"]["model"], [
        {"role": "system", "content": AGENTS["skeptic"]["system"]},
        {"role": "user", "content": f"Analyze these reports for: '{optimized_query}'\n\n{council_context}"}
    ])
    
    # --- PHASE 4: THE EDITOR ---
    yield {"type": "status", "msg": "✍️ Chief Editor: Synthesizing Final Council Dossier..."}
    
    editor_resp = await query_model(AGENTS["editor"]["model"], [
        {"role": "system", "content": AGENTS["editor"]["system"]},
        {"role": "user", "content": f"""
        Original Query: {user_query}
        Optimized Query: {optimized_query}
        
        COUNCIL REPORTS:
        {council_context}
        
        SKEPTIC AUDIT:
        {skeptic_resp['content']}
        """}
    ])
    
    duration = (datetime.now() - start_time).total_seconds()
    yield {"type": "status", "msg": f"✅ Mission Complete. Time: {duration:.1f}s"}

    # Final Result Package
    yield {
        "type": "result", 
        "data": {
            "report": editor_resp['content'],
            "sources": all_raw_sources,
            "verification_log": skeptic_resp['content'],
            "debug_streams": {
                "gemini": gemini_res['content'][:500] + "...",
                "perplexity": perplexity_res['content'][:500] + "...",
                "grok": grok_res['content'][:500] + "..."
            }
        }
    }
