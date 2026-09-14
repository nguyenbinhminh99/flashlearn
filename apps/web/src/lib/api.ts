import axios from 'axios';

const TOKEN_KEY = 'flashlearn_token';

/** Local: Vite proxy `/api` → localhost:3000. Production: set VITE_API_URL (e.g. https://xxx.onrender.com/api). */
const apiBaseUrl = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}
