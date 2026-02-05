import { apiClient } from './apiClient';
import { storage } from './storage';
import { BASE_URL } from '../config';
import { Platform } from 'react-native';

let parentHomeInFlightPromise = null;

const imageDataUriCache = new Map();
const imageDataUriInFlight = new Map();

function detectImageMimeFromBase64(base64Text) {
  if (typeof base64Text !== 'string') return null;
  const s = base64Text.trim();
  if (!s) return null;

  if (s.startsWith('/9j/')) return 'image/jpeg';
  if (s.startsWith('iVBORw0KGgo')) return 'image/png';
  if (s.startsWith('R0lGODdh') || s.startsWith('R0lGODlh')) return 'image/gif';
  if (s.startsWith('UklGR') && s.slice(0, 64).includes('V0VCUA')) return 'image/webp';
  if (s.startsWith('Qk')) return 'image/bmp';
  return null;
}

function looksLikeApiImagePath(value) {
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (!s.startsWith('/')) return false;

  if (/^\/users\/.*photo/i.test(s)) return true;
  if (/^\/children\/[0-9]+\/photo(\b|\?|#|$)/i.test(s)) return true;
  return false;
}

function normalizeImageDataUriPayload(payload) {
  if (payload == null) return null;

  let raw = null;

  if (typeof payload === 'string') {
    raw = payload;
  } else if (typeof payload === 'object') {
    raw =
      payload?.data ||
      payload?.image ||
      payload?.image_data ||
      payload?.imageData ||
      payload?.base64 ||
      payload?.content ||
      null;
  }

  if (typeof raw !== 'string') return null;
  let text = raw.trim();
  if (!text) return null;

  // If backend returned a quoted JSON string, try to unquote it.
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    try {
      text = JSON.parse(text);
    } catch (_) {
      text = text.slice(1, -1);
    }
  }

  if (typeof text !== 'string') return null;
  text = text.trim();
  if (!text) return null;

  const dataUriMatch = text.match(/^data:(image\/[a-z0-9.+-]+)(?:;[^,]*)?;base64,(.*)$/i);
  if (dataUriMatch) {
    const mime = String(dataUriMatch[1] || '').toLowerCase();
    const b64 = String(dataUriMatch[2] || '').replace(/\s+/g, '');
    if (!b64) return null;
    const detected = detectImageMimeFromBase64(b64);
    const finalMime = detected || mime || 'image/jpeg';
    return `data:${finalMime};base64,${b64}`;
  }

  if (/^https?:\/\//i.test(text)) return null;
  if (looksLikeApiImagePath(text)) return null;

  // Remove accidental whitespace/newlines inside base64.
  text = text.replace(/\s+/g, '');

  if (/^data:image\//i.test(text)) return text;

  if (text.length < 64) return null;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(text)) return null;
  const mime = detectImageMimeFromBase64(text) || 'image/jpeg';
  return `data:${mime};base64,${text}`;
}

function resolveApiImageUri(raw, fallbackPath = null) {
  const candidate = typeof raw === 'string' ? raw.trim() : '';
  const value = candidate || (typeof fallbackPath === 'string' ? fallbackPath.trim() : '');
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

function toProtectedPath(raw, fallbackPath = null) {
  const candidate = typeof raw === 'string' ? raw.trim() : '';
  const value = candidate || (typeof fallbackPath === 'string' ? fallbackPath.trim() : '');
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    try {
      // If backend gave full URL, convert it back to a path we can call with BASE_URL.
      if (value.startsWith(BASE_URL)) {
        const p = value.slice(BASE_URL.length);
        return p.startsWith('/') ? p : `/${p}`;
      }
      const u = new URL(value);
      const path = `${u.pathname}${u.search || ''}`;
      return path || null;
    } catch (_) {
      return null;
    }
  }
  return value.startsWith('/') ? value : `/${value}`;
}

function isLikelyBase64ImagePayload(text) {
  if (typeof text !== 'string') return false;
  const s = text.trim();
  if (!s) return false;
  if (/^data:image\//i.test(s)) return true;
  // Heuristic for raw base64 (without data:image/... prefix)
  // - must be reasonably long
  // - only base64 chars (and optional padding)
  const noWs = s.replace(/\s+/g, '');
  if (noWs.length < 64) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(noWs);
}

async function buildAuthorizedImageSource(raw, fallbackPath = null) {
  const uri = resolveApiImageUri(raw, fallbackPath);
  if (!uri) return null;
  if (/^data:image\//i.test(uri)) return { uri };
  const token = await storage.getToken().catch(() => null);
  return token
    ? { uri, headers: { Authorization: `Bearer ${token}` } }
    : { uri };
}

async function getImageDataUriFromProtectedEndpoint(path) {
  if (!path) return null;
  if (imageDataUriCache.has(path)) return imageDataUriCache.get(path);
  if (imageDataUriInFlight.has(path)) return imageDataUriInFlight.get(path);

  const p = (async () => {
    try {
      const token = await storage.getToken();
      if (!token) return null;
      const protectedPath = toProtectedPath(path);
      if (!protectedPath) return null;
      const res = await fetch(`${BASE_URL}${protectedPath}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
        },
      });
      if (!res.ok) return null;

      // Important: Some backends return the image as a text payload like:
      //   data:image/jpeg;base64,....
      // even when the Content-Type is image/*.
      // React Native cannot use URL.createObjectURL; we must end up with { uri: 'data:image/...'}.

      // First: opportunistically try reading as text (via clone) and only accept it if it looks
      // like a data-uri or raw base64.
      let normalized = null;

      // 1) Probe JSON payloads (some backends return { data: 'data:image/...'}).
      try {
        const jsonProbe = await res.clone().json();
        normalized = normalizeImageDataUriPayload(jsonProbe);
      } catch (_) {
        normalized = null;
      }

      // 2) Probe text payloads (including text that is JSON-encoded).
      try {
        const textProbe = await res.clone().text();
        if (!normalized) {
          const trimmed = typeof textProbe === 'string' ? textProbe.trim() : '';
          if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
            try {
              const parsed = JSON.parse(trimmed);
              normalized = normalizeImageDataUriPayload(parsed);
            } catch (_) {
              normalized = null;
            }
          }
        }

        if (!normalized && isLikelyBase64ImagePayload(textProbe)) {
          normalized = normalizeImageDataUriPayload(textProbe);
        }
      } catch (_) {
        normalized = null;
      }

      // Second: fallback to blob -> dataURL for genuine binary image responses.
      if (!normalized) {
        const blob = await res.blob().catch(() => null);
        if (!blob) return null;
        const dataUrl = await new Promise((resolve) => {
          try {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result || null);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          } catch (_) {
            resolve(null);
          }
        });
        normalized = normalizeImageDataUriPayload(dataUrl);
      }

      if (!normalized) return null;
      imageDataUriCache.set(path, normalized);
      return normalized;
    } finally {
      imageDataUriInFlight.delete(path);
    }
  })();

  imageDataUriInFlight.set(path, p);
  return p;
}

async function fetchParentHomeLive() {
  const data = await apiClient.get('/users/parent-home');
  try {
    await storage.saveParentHome(data);
  } catch (_) {}
  return data;
}

async function uploadPhotoMultipart({ path, file, childId }) {
  const token = await storage.getToken();
  if (!token) {
    const err = new Error('Session expired. Please log in again.');
    err.status = 401;
    throw err;
  }

  if (!file?.uri) {
    const err = new Error('Please select a photo to upload.');
    err.status = 400;
    throw err;
  }

  const form = new FormData();
  // NOTE: Some endpoints use a path param for child id (e.g. /children/{child_id}/photo),
  // so we only append child_id when explicitly required by the endpoint.
  if (childId != null) {
    form.append('child_id', String(childId));
  }

  const fileUri = Platform.OS === 'ios' ? String(file.uri).replace('file://', '') : String(file.uri);
  form.append('file', {
    uri: fileUri,
    name: file.name || 'photo.jpg',
    type: file.mimeType || 'image/jpeg',
  });

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: form,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const err = new Error((data && (data.detail || data.message)) || 'Upload failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  try {
    imageDataUriCache.delete(path);
  } catch (_) {}
  return data;
}

export const userService = {
  // Cached accessor for /users/parent-home. Uses AsyncStorage so multiple screens
  // can reuse the same snapshot without re-hitting the server. The cache is
  // automatically invalidated when the auth token expires (see storage.getParentHome).
  getParentHome: async (options = {}) => {
    const { forceRefresh = false } = options || {};
    if (!forceRefresh) {
      const cached = await storage.getParentHome();
      if (cached) return cached;
    }

    if (parentHomeInFlightPromise) return parentHomeInFlightPromise;
    parentHomeInFlightPromise = (async () => {
      try {
        return await fetchParentHomeLive();
      } finally {
        parentHomeInFlightPromise = null;
      }
    })();
    return parentHomeInFlightPromise;
  },
  // Explicit helper to refresh parent-home from the server and update cache.
  refreshParentHome: () => fetchParentHomeLive(),
  getCurrentParent: () => apiClient.get('/users/current-parent'),
  updateParent: (payload) => apiClient.put('/users/update-parent', payload),
  uploadParentPhoto: (file) => uploadPhotoMultipart({ path: '/users/parent-photo', file }),
  uploadChildPhoto: (childId, file) => uploadPhotoMultipart({ path: `/children/${childId}/photo`, file }),
  createIllness: (childId, payload) => apiClient.post(`/illness/create/${childId}`, payload),
  listIllnesses: (childId) => apiClient.get(`/illness/list/${childId}`),
  resolveIllness: (logId, payload) => apiClient.post(`/illness/resolve/${logId}`, payload),

  resolveApiImageUri,
  buildAuthorizedImageSource,
  getParentPhotoSource: async (raw) => {
    const normalizedInline = normalizeImageDataUriPayload(raw);
    if (normalizedInline) return { uri: normalizedInline };

    const candidate = typeof raw === 'string' ? raw.trim() : '';
    if (!candidate) return null;

    if (/^https?:\/\//i.test(candidate)) {
      return await buildAuthorizedImageSource(candidate);
    }
    const dataUri = await getImageDataUriFromProtectedEndpoint(candidate);
    return dataUri ? { uri: dataUri } : null;
  },
  getChildPhotoSource: async (childId, raw) => {
    const normalizedInline = normalizeImageDataUriPayload(raw);
    if (normalizedInline) return { uri: normalizedInline };

    const candidate = typeof raw === 'string' ? raw.trim() : '';
    if (!candidate) return null;

    if (/^https?:\/\//i.test(candidate)) {
      return await buildAuthorizedImageSource(candidate);
    }
    const dataUri = await getImageDataUriFromProtectedEndpoint(candidate);
    return dataUri ? { uri: dataUri } : null;
  },
};
