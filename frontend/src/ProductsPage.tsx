// Renders the products inventory page with search, category filter, add/edit form, and owner delete.

import { useEffect, useState, type SubmitEvent } from 'react';
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
  type Category,
  type Product,
  type ProductData,
} from './api';
import { type Session } from './LoginPage';

interface ProductsPageProps {
  session: Session;
  onLogout: () => void;
}

function isSessionExpired(err: unknown): boolean {
  return err instanceof Error && err.message === 'Session expired';
}

export default function ProductsPage({ session, onLogout }: ProductsPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadCategories() {
      try {
        const data = await getCategories(session.token);
        if (!ignore) {
          setCategories(data);
        }
      } catch (err) {
        if (ignore) {
          return;
        }
        if (isSessionExpired(err)) {
          onLogout();
          return;
        }
        setListError(err instanceof Error ? err.message : 'Failed to load categories');
      }
    }

    loadCategories();
    return () => {
      ignore = true;
    };
  }, [session.token, onLogout]);

  useEffect(() => {
    let ignore = false;
    const selectedCategoryId = categoryFilter === '' ? undefined : Number(categoryFilter);

    async function loadProducts() {
      setLoading(true);
      setListError('');
      try {
        const data = await getProducts(session.token, search, selectedCategoryId);
        if (!ignore) {
          setProducts(data);
        }
      } catch (err) {
        if (ignore) {
          return;
        }
        if (isSessionExpired(err)) {
          onLogout();
          return;
        }
        setListError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProducts();
    return () => {
      ignore = true;
    };
  }, [session.token, search, categoryFilter, reloadCount, onLogout]);

  function openAddForm() {
    setEditingProduct(null);
    setName('');
    setSku('');
    setPrice('');
    setCategoryId(categories.length > 0 ? String(categories[0].id) : '');
    setStockQuantity('0');
    setLowStockThreshold('5');
    setFormError('');
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku ?? '');
    setPrice(product.price);
    setCategoryId(String(product.category_id));
    setStockQuantity(String(product.stock_quantity));
    setLowStockThreshold(String(product.low_stock_threshold));
    setFormError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
    setFormError('');
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setSaving(true);

    const payload: ProductData = {
      name: name.trim(),
      sku: sku.trim() === '' ? null : sku.trim(),
      price: price.trim(),
      stock_quantity: Number(stockQuantity),
      low_stock_threshold: Number(lowStockThreshold),
      category_id: Number(categoryId),
    };

    try {
      if (editingProduct) {
        await updateProduct(session.token, editingProduct.id, payload);
      } else {
        await createProduct(session.token, payload);
      }
      closeForm();
      setReloadCount((count) => count + 1);
    } catch (err) {
      if (isSessionExpired(err)) {
        onLogout();
        return;
      }
      setFormError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete "${product.name}"?`)) {
      return;
    }

    setListError('');
    try {
      await deleteProduct(session.token, product.id);
      setReloadCount((count) => count + 1);
    } catch (err) {
      if (isSessionExpired(err)) {
        onLogout();
        return;
      }
      setListError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  }

  return (
    <div className="products-page">
      <header className="page-header">
        <h1 className="page-title">Shop Inventory</h1>
        <div className="header-user">
          <span className="user-info">
            {session.fullName} ({session.role})
          </span>
          <button type="button" className="btn btn-secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="toolbar">
        <input
          type="search"
          className="search-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
        />

        <select
          className="category-select"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <button type="button" className="btn btn-primary" onClick={openAddForm}>
          Add product
        </button>
      </div>

      {showForm && (
        <section className="product-form-card">
          <h2>{editingProduct ? 'Edit product' : 'Add product'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="product-form-grid">
              <div className="form-group">
                <label htmlFor="product-name">Name</label>
                <input
                  id="product-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={150}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-sku">SKU</label>
                <input
                  id="product-sku"
                  type="text"
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-price">Price</label>
                <input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-category">Category</label>
                <select
                  id="product-category"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="product-stock">Stock quantity</label>
                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  step="1"
                  value={stockQuantity}
                  onChange={(event) => setStockQuantity(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-threshold">Low stock threshold</label>
                <input
                  id="product-threshold"
                  type="number"
                  min="0"
                  step="1"
                  value={lowStockThreshold}
                  onChange={(event) => setLowStockThreshold(event.target.value)}
                  required
                />
              </div>
            </div>

            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {listError && (
        <p className="form-error" role="alert">
          {listError}
        </p>
      )}

      {loading ? (
        <p className="status-message">Loading...</p>
      ) : products.length === 0 ? (
        <p className="status-message">No products found</p>
      ) : (
        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isLowStock =
                  product.stock_quantity <= product.low_stock_threshold;

                return (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku || '-'}</td>
                    <td>{product.category.name}</td>
                    <td>{product.price}</td>
                    <td>
                      <div className="stock-cell">
                        <span>{product.stock_quantity}</span>
                        {isLowStock && (
                          <span className="badge badge-low">Low stock</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditForm(product)}
                        >
                          Edit
                        </button>
                        {session.role === 'owner' && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(product)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
