// Provides API helper functions for communicating with the Shop Inventory backend.

export interface LoginResponse {
  access_token: string;
  role: string;
  full_name: string;
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
