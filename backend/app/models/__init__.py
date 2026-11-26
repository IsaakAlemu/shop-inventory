# Exports all database models so SQLAlchemy's Base metadata discovers every table.

from app.models.category import Category
from app.models.product import Product
from app.models.user import User

__all__ = ["Category", "Product", "User"]
