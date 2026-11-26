# Defines the products API endpoints for listing, creating, updating, and deleting products.

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user, require_owner
from app.core.database import get_db
from app.models.category import Category
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def _get_product_or_404(db: Session, product_id: int) -> Product:
    product = db.scalar(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


def _ensure_category_exists(db: Session, category_id: int | None) -> None:
    category = (
        db.scalar(select(Category).where(Category.id == category_id))
        if category_id is not None
        else None
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category does not exist",
        )


def _ensure_sku_available(
    db: Session, sku: str, exclude_product_id: int | None = None
) -> None:
    stmt = select(Product).where(Product.sku == sku)
    if exclude_product_id is not None:
        stmt = stmt.where(Product.id != exclude_product_id)
    if db.scalar(stmt) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SKU already exists",
        )


@router.get("", response_model=list[ProductOut], dependencies=[Depends(get_current_user)])
def list_products(
    search: str | None = None,
    category_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[Product]:
    stmt = select(Product).options(selectinload(Product.category))
    if search and search.strip():
        stmt = stmt.where(Product.name.ilike(f"%{search.strip()}%"))
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    stmt = stmt.order_by(Product.name)
    return list(db.scalars(stmt).all())


@router.get(
    "/{product_id}",
    response_model=ProductOut,
    dependencies=[Depends(get_current_user)],
)
def get_product(product_id: int, db: Session = Depends(get_db)) -> Product:
    return _get_product_or_404(db, product_id)


@router.post(
    "",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_user)],
)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> Product:
    _ensure_category_exists(db, payload.category_id)
    if payload.sku is not None:
        _ensure_sku_available(db, payload.sku)

    product = Product(**payload.model_dump())
    db.add(product)
    db.flush()
    product_id = product.id
    db.commit()
    return _get_product_or_404(db, product_id)


@router.patch(
    "/{product_id}",
    response_model=ProductOut,
    dependencies=[Depends(get_current_user)],
)
def update_product(
    product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)
) -> Product:
    product = _get_product_or_404(db, product_id)
    updates = payload.model_dump(exclude_unset=True)

    if "category_id" in updates:
        _ensure_category_exists(db, updates["category_id"])
    if "sku" in updates and updates["sku"] is not None:
        _ensure_sku_available(db, updates["sku"], exclude_product_id=product_id)

    for field in ("name", "price", "stock_quantity", "low_stock_threshold"):
        if field in updates and updates[field] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"{field} cannot be null",
            )

    for field, value in updates.items():
        setattr(product, field, value)

    db.commit()
    return _get_product_or_404(db, product_id)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_owner)],
)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> None:
    product = _get_product_or_404(db, product_id)
    db.delete(product)
    db.commit()
