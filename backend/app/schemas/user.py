# Defines Pydantic response schemas for user data.

from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str

    model_config = ConfigDict(from_attributes=True)
