# Defines Pydantic request and response schemas for categories and products.

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CategoryOut(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    sku: str | None = Field(default=None, max_length=50)
    price: Decimal = Field(ge=0, decimal_places=2)
    stock_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    category_id: int


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    sku: str | None = Field(default=None, max_length=50)
    price: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    stock_quantity: int | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)
    category_id: int | None = None


class ProductOut(BaseModel):
    id: int
    name: str
    sku: str | None
    price: Decimal
    stock_quantity: int
    low_stock_threshold: int
    category_id: int
    category: CategoryOut

    model_config = ConfigDict(from_attributes=True)
