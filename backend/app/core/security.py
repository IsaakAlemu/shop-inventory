# Provides password hashing and JWT access token utilities for authentication.

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

ALGORITHM = "HS256"
password_hash = PasswordHash.recommended()


def hash_password(plain: str) -> str:
    return password_hash.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return password_hash.verify(plain, hashed)


def create_access_token(subject: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "sub": subject,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
