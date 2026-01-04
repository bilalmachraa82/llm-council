"""
Deep Research Council - 5-Agent Multi-Step Research System.
"""

import asyncio
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

# Search Tools
from duckduckgo_search import DDGS
# Optional Tavily import
try:
    from tavily import TavilyClient
except ImportError:
    TavilyClient = None

from .openrouter import query_model
from .config_pro import OPENROUTER_API_KEY, TAVILY_API_KEY, SEARCH_PROVIDER

# -----------------------------------------------------------------------------
# 1. Search Tool Implementation
# -----------------------------------------------------------------------------

async def perform_search(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """
    Perform a web search using the configured provider (Tavily or DuckDuckGo).
    Returns list of dicts: {'title': str, 'href': str, 'body': str}
    """
    print(f"🔎 Searching for: {query} (Provider: {SEARCH_PROVIDER})")
    
    results = []

    # Option A: Tavily (Premium)
    if SEARCH_PROVIDER == "tavily" and TAVILY_API_KEY and TavilyClient:
        try:
            # Tavily client is synchronous, so we run it in a thread or just block briefly
            # For deeper async integration, we'd wrap this. For now, direct call.
            client = TavilyClient(api_key=TAVILY_API_KEY)
            tavily_resp = client.search(
                query=query, 
                search_depth="advanced", 
                max_results=max_results,
                include_raw_content=False
            )
            # Tavily format: {'results': [{'title':..., 'url':..., 'content':...}]}
            for res in tavily_resp.get('results', []):
                results.append({
                    "title": res.get("title", "No Title"),
                    "href": res.get("url", ""),
                    "body": res.get("content", "")
                })
            return results
        except Exception as e:
            print(f"⚠️ Tavily Error: {e}. Falling back to DuckDuckGo.")
            # Fallthrough to DDG

    # Option B: DuckDuckGo (Free)
    try:
        # DDGS is synchronous in current pip version 6.x usually, 
        # but 4.x/5.x has AsyncDDGS. Let's assume standard synchronous for safety or wrap.
        # We will use the synchronous DDGS in a thread to avoid blocking the event loop.
        def run_ddg():
            with DDGS() as ddgs:
                return list(ddgs.text(query, max_results=max_results))
        
        # Run in thread
        ddg_results = await asyncio.to_thread(run_ddg)
        
        for res in ddg_results:
            results.append({
                "title": res.get("title", ""),
                "href": res.get("href", ""),
                "body": res.get("body", "")
            })
    except Exception as e:
        print(f"❌ Search Error: {e}")
        return [{"title": "Error", "href": "", "body": f"Search failed: {str(e)}"}]

    return results

# -----------------------------------------------------------------------------
# 2. Agent Prompts
# -----------------------------------------------------------------------------

AGENTS = {
    # 1. LEAD RESEARCHER: Plans the research
    "lead": {
        "model": "google/gemini-2.0-flash-thinking-exp-1219",  # Reasoning model for planning
        "system": """You are the LEAD RESEARCHER for an Elite Market Intelligence unit.
Your goal is to break down a complex User Query into 3-4 distinct, targeted search queries that will yield concrete data.
Focus on:
1. Hard Industry Data (Market size, CAGR)
2. Competitive Landscape (Major players, recent moves)
3. Emerging Trends (User sentiment, new tech)

Output strictly a JSON object: {"queries": ["query 1", "query 2", "query 3"]}."""
    },

    # 2. MARKET ANALYST: Extracts hard data
    "analyst": {
        "model": "anthropic/claude-3.5-sonnet", # High reasoning for data extraction
        "system": """You are the MARKET ANALYST. Your job is to extract HARD FACTS, NUMBERS, and STATISTICS from search results.
Ignore fluff. Look for:
- Revenue numbers
- Market cap
- Growth % (CAGR)
- User counts
- Dates of specific events

Format your findings as a bulleted list of facts with their source URLs."""
    },

    # 3. TREND HUNTER: Finds qualitative signals
    "trend_hunter": {
        "model": "google/gemini-2.0-flash-exp", # Large context, fast
        "system": """You are the TREND HUNTER. You look for "Weak Signals", emerging cultural shifts, and qualitative user sentiment.
Look for:
- What are people complaining about? (Reddit/social mentions in search)
- What is the "next big thing" barely being discussed?
- Disruptive startups not yet mainstream.

Format your findings as a list of "Signals" with source URLs."""
    },

    # 4. THE SKEPTIC: Verifies truth
    "skeptic": {
        "model": "anthropic/claude-3.5-sonnet", # Best critical thinking
        "system": """You are THE SKEPTIC. Your only loyalty is to THE TRUTH.
You will receive a set of "Draft Insights" and their "Source Context".
Your job is to ATTACK the insights.
1. Does the source actually say that?
2. Is the source credible? (Flag blogs/forums vs official reports)
3. Is the date relevant? (Flag 2021 data presented as current)

Output a "Verification Report":
- ✅ VERIFIED: [Claim]
- ⚠️ WARNING: [Claim] - Reason (e.g. source is weak)
- ❌ DEBUNKED: [Claim] - Reason (e.g. source says opposite)"""
    },

    # 5. CHIEF EDITOR: Synthesizes final report
    "editor": {
        "model": "google/gemini-2.0-pro-exp-02-05", # Excellent long-form writing
        "system": """You are the CHIEF EDITOR. You compile the final "Deep Research Report".
Use the "Verified Facts" and "Trend Signals" provided.
Discard anything flagged as DEBUNKED by the Skeptic.
Treat warnings with caution.

Format:
# [Title]

## Executive Summary
(2-3 sentences)

## Market Analysis (Hard Data)
(Use tables if possible)

## Emerging Trends & Signals
(Qualitative analysis)

## Critical Verification Note
(Briefly mention what the Skeptic verified/debunked to show rigour)

## References
[1] Title - URL
...
"""
    }
}

# -----------------------------------------------------------------------------
# 3. Orchestration Logic
# -----------------------------------------------------------------------------

async def run_deep_research(user_query: str):
    """
    Generator that yields status updates and final result of the 5-agent workflow.
    """
    yield {"type": "status", "msg": "🧠 Lead Researcher: Deconstructuring query..."}
    
    # --- STEP 1: PLAN ---
    lead_messages = [
        {"role": "system", "content": AGENTS["lead"]["system"]},
        {"role": "user", "content": f"Query: {user_query}"}
    ]
    lead_resp = await query_model(AGENTS["lead"]["model"], lead_messages)
    
    try:
        # Cleanup json block if model adds markdown
        content = lead_resp['content'].replace('```json', '').replace('```', '')
        plan = json.loads(content)
        queries = plan.get("queries", [])
    except:
        # Fallback
        queries = [user_query, f"{user_query} market size", f"{user_query} trends"]

    yield {"type": "status", "msg": f"🔎 Searching: {', '.join(queries)}"}

    # --- STEP 2: SEARCH (Parallel) ---
    search_tasks = [perform_search(q) for q in queries]
    search_results_list = await asyncio.gather(*search_tasks)
    
    # Flatten results
    all_sources = []
    for res_list in search_results_list:
        all_sources.extend(res_list)
    
    # Remove duplicates (by href)
    unique_sources = {s['href']: s for s in all_sources}.values()
    
    # Limit context size for agents (top 10 sources approx)
    context_str = ""
    for idx, s in enumerate(list(unique_sources)[:10]):
        context_str += f"Source {idx+1} [{s['title']}]({s['href']}):\n{s['body'][:800]}\n\n"

    yield {"type": "status", "msg": "📊 Analyst & Hunter: Extracting insights..."}

    # --- STEP 3: ANALYZE & HUNT (Parallel) ---
    analyst_task = query_model(AGENTS["analyst"]["model"], [
        {"role": "system", "content": AGENTS["analyst"]["system"]},
        {"role": "user", "content": f"Context:\n{context_str}\n\nTask: Extract hard data for '{user_query}'"}
    ])
    
    hunter_task = query_model(AGENTS["trend_hunter"]["model"], [
        {"role": "system", "content": AGENTS["trend_hunter"]["system"]},
        {"role": "user", "content": f"Context:\n{context_str}\n\nTask: Find trends/signals for '{user_query}'"}
    ])

    analyst_resp, hunter_resp = await asyncio.gather(analyst_task, hunter_task)
    
    draft_insights = f"""
    === ANALYST DATA ===
    {analyst_resp['content']}
    
    === TREND SIGNALS ===
    {hunter_resp['content']}
    """

    yield {"type": "status", "msg": "🛡️ The Skeptic: Verifying truth claims..."}

    # --- STEP 4: VERIFY (The Skeptic) ---
    skeptic_messages = [
        {"role": "system", "content": AGENTS["skeptic"]["system"]},
        {"role": "user", "content": f"Original Queries: {queries}\n\nContext:\n{context_str}\n\nDraft Insights:\n{draft_insights}"}
    ]
    skeptic_resp = await query_model(AGENTS["skeptic"]["model"], skeptic_messages)
    
    yield {"type": "status", "msg": "✍️ Chief Editor: Compiling final report..."}

    # --- STEP 5: SYNTHESIZE ---
    editor_messages = [
        {"role": "system", "content": AGENTS["editor"]["system"]},
        {"role": "user", "content": f"""
        User Query: {user_query}
        
        Verified Skeptic Report:
        {skeptic_resp['content']}
        
        (Use the details from below if they were VERIFIED)
        Draft Insights:
        {draft_insights}
        """}
    ]
    editor_resp = await query_model(AGENTS["editor"]["model"], editor_messages)

    # Final Result
    yield {
        "type": "result", 
        "data": {
            "report": editor_resp['content'],
            "sources": list(unique_sources)[:10],
            "verification_log": skeptic_resp['content']
        }
    }
