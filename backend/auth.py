"""Authentication module using Neon PostgreSQL + Prisma."""

import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional

# JWT Secret - MUST be set in production (fail fast if not set)
_jwt_secret = os.getenv("JWT_SECRET")
if not _jwt_secret:
    if os.getenv("ENVIRONMENT") == "production":
        raise ValueError("JWT_SECRET must be set in production")
    # Only use default in development
    _jwt_secret = "dev-only-secret-change-in-production"

JWT_SECRET = _jwt_secret

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_access_token(user_id: str, email: str) -> str:
    """Create a JWT access token."""
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_user_id(authorization: str) -> Optional[str]:
    """Extract user_id from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.replace("Bearer ", "")
    payload = decode_access_token(token)
    return payload.get("sub") if payload else None
