# Seeds initial product categories and demo user accounts into the database.

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.category import Category
from app.models.user import User, UserRole

CATEGORIES = [
    "Groceries",
    "Beverages",
    "Snacks",
    "Household",
    "Personal Care",
    "Clothing",
    "Other",
]

USERS = [
    {
        "email": "owner@demo.shop",
        "full_name": "Demo Owner",
        "password": "demo1234",
        "role": UserRole.OWNER.value,
    },
    {
        "email": "staff@demo.shop",
        "full_name": "Demo Staff",
        "password": "demo1234",
        "role": UserRole.STAFF.value,
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        for name in CATEGORIES:
            existing_category = db.scalar(
                select(Category).where(Category.name == name)
            )
            if existing_category:
                print(f"Skipped category (already exists): {name}")
                continue

            db.add(Category(name=name))
            print(f"Created category: {name}")

        for user_data in USERS:
            existing_user = db.scalar(
                select(User).where(User.email == user_data["email"])
            )
            if existing_user:
                print(f"Skipped user (already exists): {user_data['email']}")
                continue

            db.add(
                User(
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    hashed_password=hash_password(user_data["password"]),
                    role=user_data["role"],
                )
            )
            print(f"Created user: {user_data['email']}")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
