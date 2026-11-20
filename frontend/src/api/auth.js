// Account endpoints. Each returns the `data` part of the response.
import { api } from './client';

export const login = (email, password) => api.post('/auth/login', { email, password });

export const register = (fields) => api.post('/auth/register', fields);

export const me = () => api.get('/auth/me');
