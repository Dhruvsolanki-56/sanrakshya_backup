import { apiClient } from '../apiClient';
import { BASE_URL } from '../../config';
import { storage } from '../storage';
import { Platform } from 'react-native';

const fetchFileAsDataUrl = async (path) => {
  const token = await storage.getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: '*/*',
    },
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    } else {
      data = await res.text().catch(() => null);
    }
    const message =
      (data && typeof data === 'object' && (data.detail || data.message)) ||
      (typeof data === 'string' && data) ||
      'Unable to load document';
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const doctorService = {
  getDoctorHome: async () => apiClient.get('/doctor/users/doctor-home'),

  getVerificationStatus: async () => apiClient.get('/doctor/documents/verification/status'),

  uploadVerificationDocument: async ({ document_type, document_name, file }) => {
    const token = await storage.getToken();
    const form = new FormData();
    const normalizedType = (document_type || '').toString().toLowerCase();
    form.append('document_type', normalizedType);
    form.append('document_name', document_name);
    const uri = Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri;
    form.append('file', {
      uri,
      name: file.name || 'document',
      type: file.mimeType || 'application/octet-stream',
    });

    const res = await fetch(`${BASE_URL}/doctor/documents/verification`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: form,
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      // Try to extract a meaningful message from API, fall back to generic
      let message = 'Upload failed';
      if (data) {
        if (Array.isArray(data.detail) && data.detail.length > 0) {
          message = data.detail.map((d) => d.msg || '').filter(Boolean).join('\n') || message;
        } else if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (typeof data.message === 'string') {
          message = data.message;
        }
      }

      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },
  searchPlaces: async (query) => {
    const hasQuery = typeof query === 'string' && query.length > 0;
    const q = hasQuery ? `q=${encodeURIComponent(query)}` : '';
    const params = `${q}${q ? '&' : ''}limit=10`;
    return apiClient.get(`/doctor/places?${params}`);
  },
  getPlaceById: async (id) => apiClient.get(`/doctor/places/${id}`),
  getPlaceRoleDocuments: async (placeId) => apiClient.get(`/doctor/documents/roles/place/${placeId}/documents`),
  enrollWorkplace: async (payload) => {
    const token = await storage.getToken();
    const form = new FormData();
    if (payload.existing_place_id) {
      form.append('existing_place_id', String(payload.existing_place_id));
      form.append('role', String(payload.role || ''));
      const docs = Array.isArray(payload.docs) ? payload.docs.slice(0, 1) : [];
      if (docs.length) {
        const d = docs[0];
        if (d.type) form.append('doc_type', String(d.type));
        if (d.name) form.append('doc_name', String(d.name));
        if (d.file && d.file.uri) {
          const uri = Platform.OS === 'ios' ? d.file.uri.replace('file://', '') : d.file.uri;
          form.append('file', { uri, name: d.file.name || 'document', type: d.file.mimeType || 'application/octet-stream' });
        }
      }
    } else {
      form.append('role', String(payload.role || ''));
      form.append('name', String(payload.name || ''));
      if (payload.type) form.append('type', String(payload.type));
      if (payload.official_phone) form.append('official_phone', String(payload.official_phone));
      if (payload.address_line1) form.append('address_line1', String(payload.address_line1));
      if (payload.address_city) form.append('address_city', String(payload.address_city));
      if (payload.address_state) form.append('address_state', String(payload.address_state));
      if (payload.address_pincode) form.append('address_pincode', String(payload.address_pincode));
      if (payload.address_line2) form.append('address_line2', String(payload.address_line2));
      if (payload.address_area_locality) form.append('address_area_locality', String(payload.address_area_locality));
      if (payload.address_country) form.append('address_country', String(payload.address_country));
      const docs = Array.isArray(payload.docs) ? payload.docs.slice(0, 1) : [];
      if (docs.length) {
        const d = docs[0];
        if (d.type) form.append('doc_type', String(d.type));
        if (d.name) form.append('doc_name', String(d.name));
        if (d.file && d.file.uri) {
          const uri = Platform.OS === 'ios' ? d.file.uri.replace('file://', '') : d.file.uri;
          form.append('file', { uri, name: d.file.name || 'document', type: d.file.mimeType || 'application/octet-stream' });
        }
      }
    }

    const res = await fetch(`${BASE_URL}/doctor/places/enroll`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      body: form,
    });
    const data = await res.json().catch(() => null);
  
    if (!res.ok) {
      let message = 'Submit failed';
      if (data) {
        if (Array.isArray(data.detail) && data.detail.length > 0) {
          message = data.detail.map((d) => d.msg || '').filter(Boolean).join('\n') || message;
        } else if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (typeof data.message === 'string') {
          message = data.message;
        }
      }
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  uploadRoleDocument: async (roleId, { document_type, document_name, file }) => {
    const token = await storage.getToken();
    const form = new FormData();
    const normalizedType = (document_type || '').toString().toLowerCase();
    form.append('document_type', normalizedType);
    form.append('document_name', document_name);
    const uri = Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri;
    form.append('file', {
      uri,
      name: file.name || 'document',
      type: file.mimeType || 'application/octet-stream',
    });

    const res = await fetch(`${BASE_URL}/doctor/places/roles/${roleId}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: form,
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      let message = 'Submit failed';
      if (data) {
        if (Array.isArray(data.detail) && data.detail.length > 0) {
          message = data.detail.map((d) => d.msg || '').filter(Boolean).join('\n') || message;
        } else if (typeof data.detail === 'string') {
          message = data.detail;
        } else if (typeof data.message === 'string') {
          message = data.message;
        }
      }
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },
  getOwnerPlaceRoleRequests: async (placeId) => apiClient.get(`/doctor/owner/places/${placeId}/role-requests`),

  getOwnerPlaceRoleReview: async (placeId, roleId) => apiClient.get(`/doctor/owner/places/${placeId}/roles/${roleId}/review`),

  approveOwnerPlaceRoleRequest: async (placeId, roleId) => apiClient.post(`/doctor/owner/places/${placeId}/roles/${roleId}/approve`),

  rejectOwnerPlaceRoleRequest: async (placeId, roleId, payload) => apiClient.post(`/doctor/owner/places/${placeId}/roles/${roleId}/reject`, payload),

  requestOwnerPlaceRoleResubmission: async (placeId, roleId, payload) =>
    apiClient.post(`/doctor/owner/places/${placeId}/roles/${roleId}/resubmission`, payload),

  deleteOwnerPlaceRole: async (placeId, roleId) => apiClient.del(`/doctor/owner/places/${placeId}/roles/${roleId}`),

  getOwnerRoleDocumentFile: async (placeId, docId) =>
    fetchFileAsDataUrl(`/doctor/owner/places/${placeId}/role-documents/${docId}/file`),

  getOwnerVerificationDocumentFile: async (placeId, docId) =>
    fetchFileAsDataUrl(`/doctor/owner/places/${placeId}/verification-documents/${docId}/file`),
};
