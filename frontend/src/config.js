// The only place that knows where the API lives. Set VITE_API_URL in
// frontend/.env (see .env.example); the fallback is the local backend.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
