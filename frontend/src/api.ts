// Provides API helper functions for auth, categories, and products requests.

export interface LoginResponse {
  access_token: string;
  role: string;
  full_name: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string | null;
  price: string;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: number;
  category: Category;
}

export interface ProductData {
  name: string;
  sku: string | null;
  price: number | string;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: number;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let message = 'Login failed';
    try {
      const errorData = (await response.json()) as { detail?: unknown };
      if (typeof errorData.detail === 'string' && errorData.detail.trim() !== '') {
        message = errorData.detail;
      }
    } catch {
      // Fall back to the default message if the error response is not JSON.
    }
    throw new Error(message);
  }

  const data = (await response.json()) as LoginResponse;
  return {
    access_token: data.access_token,
    role: data.role,
    full_name: data.full_name,
  };
}

async function authFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new Error('Session expired');
  }

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const errorData = (await response.json()) as { detail?: unknown };
      if (typeof errorData.detail === 'string' && errorData.detail.trim() !== '') {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
        const firstError = errorData.detail[0] as { msg?: unknown };
        if (typeof firstError?.msg === 'string' && firstError.msg.trim() !== '') {
          message = firstError.msg;
        }
      }
    } catch {
      // Fall back to the default message if the error response is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getCategories(token: string): Promise<Category[]> {
  return authFetch<Category[]>('/categories', token);
}

export function getProducts(
  token: string,
  search?: string,
  categoryId?: number,
): Promise<Product[]> {
  const params = new URLSearchParams();
  if (search && search.trim() !== '') {
    params.set('search', search.trim());
  }
  if (categoryId !== undefined) {
    params.set('category_id', String(categoryId));
  }
  const query = params.toString();
  const path = query ? `/products?${query}` : '/products';
  return authFetch<Product[]>(path, token);
}

export function createProduct(token: string, data: ProductData): Promise<Product> {
  return authFetch<Product>('/products', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProduct(
  token: string,
  id: number,
  data: Partial<ProductData>,
): Promise<Product> {
  return authFetch<Product>(`/products/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteProduct(token: string, id: number): Promise<void> {
  return authFetch<void>(`/products/${id}`, token, {
    method: 'DELETE',
  });
}
