"""Image generation utility using Flux via OpenRouter."""

import httpx
from typing import Optional, Dict, Any
from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL

# Use Flux Pro model for image generation
IMAGE_MODEL = "black-forest-labs/flux.2-pro"

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
        "HTTP-Referer": "https://llm-council.aiparati.pt",
        "X-Title": "LLM Council Image Studio",
    }

    payload = {
        "model": IMAGE_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
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
            
            # Extract image from response
            message = data['choices'][0]['message']
            
            # OpenRouter Flux puts images in message.images field (not content)
            images = message.get('images', [])
            if images:
                for img in images:
                    if img.get('type') == 'image_url':
                        image_url = img.get('image_url', {}).get('url')
                        if image_url:
                            return {'url': image_url, 'revised_prompt': prompt}
            
            # Fallback: check content field (for other models)
            content = message.get('content')
            if isinstance(content, list):
                for block in content:
                    if block.get('type') == 'image_url':
                        image_url = block.get('image_url', {}).get('url')
                        if image_url:
                            return {'url': image_url, 'revised_prompt': prompt}
            elif isinstance(content, str) and content.startswith('data:image'):
                return {'url': content, 'revised_prompt': prompt}
            
            # No image found
            print(f"No image found in response: {str(data)[:500]}")
            return None

    except httpx.HTTPStatusError as e:
        print(f"OpenRouter API Error: {e.response.status_code}")
        print(f"Error Body: {e.response.text}")
        return None
    except Exception as e:
        print(f"Error generating image: {e}")
        return None



