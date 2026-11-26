# Defines FastAPI dependencies for authenticating users and enforcing owner access.

from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_exception

    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise credentials_exception

    sub = payload.get("sub")
    if not isinstance(sub, (str, int)) or isinstance(sub, bool):
        raise credentials_exception

    try:
        user_id = int(sub)
    except ValueError:
        raise credentials_exception

    user = db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_owner(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.OWNER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner access required",
        )
    return user
