"""Image generation utility using Flux via OpenRouter."""

import httpx
from typing import Optional, Dict, Any
from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL, IMAGE_MODEL

async def generate_image(prompt: str) -> Optional[Dict[str, Any]]:
    """
    Generate an image using Flux via OpenRouter.
    
    Args:
        prompt: The text description of the image.
        
    Returns:
        Dict with image info (URL or base64) or None if failed.
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": IMAGE_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ],
        "modalities": ["image", "text"],
        "response_format": {
            "type": "text"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract image outcome
            # The structure for multi-modal responses can vary, 
            # but usually it's in message.content as a list or a specific field.
            message = data['choices'][0]['message']
            content = message.get('content')
            
            # OpenRouter Flux usually returns a list of content blocks
            if isinstance(content, list):
                for block in content:
                    if block.get('type') == 'image':
                        return {
                            'url': block.get('image', {}).get('url'),
                            'revised_prompt': block.get('image', {}).get('revised_prompt')
                        }
            
            # Fallback if it's not a list or structure is different
            return {'raw_data': data}

    except Exception as e:
        print(f"Error generating image: {e}")
        return None
