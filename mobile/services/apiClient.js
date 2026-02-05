import { BASE_URL } from '../config';
import { storage } from './storage';

async function buildHeaders(extra = {}) {
  const token = await storage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function extractErrorMessage(data) {
  if (!data) return 'Request failed';
  if (typeof data === 'string') return data;
  const detail = data?.detail;
  if (Array.isArray(detail) && detail.length) {
    const msgs = detail.map((d) => (d && typeof d === 'object' ? d.msg : '')).filter(Boolean);
    if (msgs.length) return msgs.join('\n');
  }
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  return 'Request failed';
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: await buildHeaders(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const err = new Error(extractErrorMessage(data));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const apiClient = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
