import json
import os
import asyncio
from typing import Dict, Any, Optional

SETTINGS_FILE = "user_settings.json"

# In-memory cache
_settings_cache: Dict[str, Any] = {}
_lock = asyncio.Lock()

def _load_settings_file():
    """Load settings from disk synchronously."""
    global _settings_cache
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r") as f:
                _settings_cache = json.load(f)
        except Exception as e:
            print(f"Error loading settings: {e}")
            _settings_cache = {}
    else:
        _settings_cache = {}

def _save_settings_file():
    """Save settings to disk synchronously."""
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(_settings_cache, f, indent=2)
    except Exception as e:
        print(f"Error saving settings: {e}")

async def get_all_settings() -> Dict[str, Any]:
    """Get all settings."""
    async with _lock:
        if not _settings_cache:
            _load_settings_file()
        return _settings_cache

async def get_user_settings(user_id: str) -> Dict[str, Any]:
    """Get settings for a specific user."""
    all_settings = await get_all_settings()
    return all_settings.get(user_id, {})

async def update_user_settings(user_id: str, new_settings: Dict[str, Any]) -> Dict[str, Any]:
    """Update settings for a specific user."""
    async with _lock:
        if not _settings_cache:
            _load_settings_file()
        
        # Merge or replace? Let's use deep merge logic if needed, but for now simple update
        current = _settings_cache.get(user_id, {})
        current.update(new_settings)
        _settings_cache[user_id] = current
        
        _save_settings_file()
        return current
