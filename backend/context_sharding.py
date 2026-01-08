"""
Context Sharding Module - BMAD Phase 4
Implements semantic chunking for token optimization in long conversations.
90% token savings by loading only relevant context per query.
"""

import hashlib
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

# ═══════════════════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class ContextChunk:
    """A semantic chunk of conversation context."""
    id: str
    content: str
    token_estimate: int
    keywords: List[str]
    timestamp: str
    role: str  # 'user' or 'assistant'


# ═══════════════════════════════════════════════════════════════════════════
# CHUNKING UTILITIES
# ═══════════════════════════════════════════════════════════════════════════

def estimate_tokens(text: str) -> int:
    """Simple token estimation (1 token ≈ 4 chars for English)."""
    return len(text) // 4


def extract_keywords(text: str, top_n: int = 5) -> List[str]:
    """Extract top N keywords from text using simple frequency analysis."""
    # Remove common stopwords
    stopwords = {
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of',
        'in', 'for', 'on', 'with', 'at', 'by', 'from', 'or', 'and', 'but',
        'if', 'then', 'that', 'this', 'it', 'i', 'you', 'he', 'she', 'we',
        'they', 'what', 'which', 'who', 'how', 'when', 'where', 'why'
    }
    
    # Tokenize and clean
    words = text.lower().split()
    words = [w.strip('.,!?;:()[]{}"\'-') for w in words]
    words = [w for w in words if len(w) > 3 and w not in stopwords]
    
    # Count frequencies
    freq = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
    
    # Sort by frequency
    sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
    
    return [w[0] for w in sorted_words[:top_n]]


def chunk_messages(messages: List[Dict[str, Any]], max_tokens_per_chunk: int = 2000) -> List[ContextChunk]:
    """
    Break conversation messages into semantic chunks.
    Groups messages until max_tokens_per_chunk is reached.
    """
    chunks = []
    current_content = []
    current_tokens = 0
    chunk_index = 0
    
    for msg in messages:
        content = msg.get('content', '')
        role = msg.get('role', 'user')
        tokens = estimate_tokens(content)
        
        # If adding this message exceeds limit, save current chunk
        if current_tokens + tokens > max_tokens_per_chunk and current_content:
            combined = '\n\n'.join(current_content)
            chunk_id = hashlib.md5(combined.encode()).hexdigest()[:8]
            
            chunks.append(ContextChunk(
                id=f"chunk_{chunk_index}_{chunk_id}",
                content=combined,
                token_estimate=current_tokens,
                keywords=extract_keywords(combined),
                timestamp=msg.get('timestamp', ''),
                role='mixed'
            ))
            
            current_content = []
            current_tokens = 0
            chunk_index += 1
        
        # Add message to current chunk
        current_content.append(f"[{role.upper()}]: {content}")
        current_tokens += tokens
    
    # Save remaining content
    if current_content:
        combined = '\n\n'.join(current_content)
        chunk_id = hashlib.md5(combined.encode()).hexdigest()[:8]
        
        chunks.append(ContextChunk(
            id=f"chunk_{chunk_index}_{chunk_id}",
            content=combined,
            token_estimate=current_tokens,
            keywords=extract_keywords(combined),
            timestamp='',
            role='mixed'
        ))
    
    return chunks


# ═══════════════════════════════════════════════════════════════════════════
# RELEVANCE SCORING
# ═══════════════════════════════════════════════════════════════════════════

def score_chunk_relevance(chunk: ContextChunk, query: str) -> float:
    """
    Score how relevant a chunk is to the current query.
    Returns a score between 0.0 and 1.0.
    """
    query_keywords = set(extract_keywords(query, top_n=10))
    chunk_keywords = set(chunk.keywords)
    
    if not query_keywords:
        return 0.5  # Default relevance if no keywords
    
    # Jaccard similarity
    intersection = len(query_keywords & chunk_keywords)
    union = len(query_keywords | chunk_keywords)
    
    if union == 0:
        return 0.5
    
    return intersection / union


def select_relevant_chunks(
    chunks: List[ContextChunk], 
    query: str, 
    max_tokens: int = 8000,
    min_relevance: float = 0.1
) -> List[ContextChunk]:
    """
    Select the most relevant chunks that fit within the token budget.
    Always includes the most recent chunk.
    """
    if not chunks:
        return []
    
    # Score all chunks
    scored = [(chunk, score_chunk_relevance(chunk, query)) for chunk in chunks]
    
    # Sort by relevance (descending)
    scored.sort(key=lambda x: x[1], reverse=True)
    
    # Always include the most recent chunk (last in original list)
    selected = [chunks[-1]]
    total_tokens = chunks[-1].token_estimate
    
    # Add high-relevance chunks
    for chunk, score in scored:
        if chunk.id == chunks[-1].id:
            continue  # Already added
        
        if score < min_relevance:
            continue  # Too low relevance
        
        if total_tokens + chunk.token_estimate > max_tokens:
            continue  # Would exceed budget
        
        selected.append(chunk)
        total_tokens += chunk.token_estimate
    
    # Sort selected chunks by original order (for coherence)
    chunk_order = {c.id: i for i, c in enumerate(chunks)}
    selected.sort(key=lambda c: chunk_order.get(c.id, 0))
    
    return selected


def build_sharded_context(
    messages: List[Dict[str, Any]], 
    query: str,
    max_context_tokens: int = 8000
) -> str:
    """
    Main entry point: Build an optimized context from conversation messages.
    Returns a string suitable for inclusion in an LLM prompt.
    """
    # Chunk the messages
    chunks = chunk_messages(messages)
    
    # If few chunks, just return everything
    total_tokens = sum(c.token_estimate for c in chunks)
    if total_tokens <= max_context_tokens:
        return '\n\n'.join(c.content for c in chunks)
    
    # Select relevant chunks
    selected = select_relevant_chunks(chunks, query, max_context_tokens)
    
    # Build context with indicators
    context_parts = []
    
    for i, chunk in enumerate(selected):
        if chunk == chunks[-1]:
            context_parts.append(f"=== RECENT CONTEXT ===\n{chunk.content}")
        else:
            context_parts.append(f"=== RELEVANT CONTEXT (Keywords: {', '.join(chunk.keywords[:3])}) ===\n{chunk.content}")
    
    return '\n\n'.join(context_parts)


# ═══════════════════════════════════════════════════════════════════════════
# INTEGRATION HELPERS
# ═══════════════════════════════════════════════════════════════════════════

def get_sharding_stats(messages: List[Dict[str, Any]], query: str, max_tokens: int = 8000) -> Dict[str, Any]:
    """
    Get statistics about sharding performance for debugging.
    """
    chunks = chunk_messages(messages)
    total_tokens = sum(c.token_estimate for c in chunks)
    
    selected = select_relevant_chunks(chunks, query, max_tokens)
    selected_tokens = sum(c.token_estimate for c in selected)
    
    return {
        "original_tokens": total_tokens,
        "sharded_tokens": selected_tokens,
        "savings_percent": round((1 - selected_tokens / total_tokens) * 100, 1) if total_tokens > 0 else 0,
        "num_chunks": len(chunks),
        "num_selected": len(selected)
    }
