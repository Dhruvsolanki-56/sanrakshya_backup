import { Platform } from 'react-native';
import { BASE_URL } from '../config';
import { storage } from './storage';

export const healthRecordsService = {
    /**
     * Private helper for authenticated requests
     */
    _fetchWithAuth: async (path, options = {}) => {
        const token = await storage.getToken();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            ...options.headers,
        };

        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            throw new Error('Session expired. Please log in again.');
        }

        return response;
    },

    /**
     * Fetch list of reports
     */
    getReports: async (childId) => {
        const response = await healthRecordsService._fetchWithAuth(`/reports/children/${childId}/reports`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to fetch medical history');
        return data;
    },

    /**
     * Upload (Multipart/Form-Data)
     */
    uploadReport: async (childId, { report_type, title, description, file }) => {
        const token = await storage.getToken();
        const formData = new FormData();
        formData.append('report_type', report_type);
        formData.append('title', title);
        formData.append('description', description || '');

        const fileUri = Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri;
        formData.append('file', {
            uri: fileUri,
            name: file.name || 'document',
            type: file.mimeType || 'application/octet-stream',
        });

        const response = await fetch(`${BASE_URL}/reports/children/${childId}/reports`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Upload failed');
        return data;
    },

    /**
     * Delete
     */
    deleteReport: async (childId, reportId) => {
        const response = await healthRecordsService._fetchWithAuth(`/reports/children/${childId}/reports/${reportId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || 'Removal failed');
        }
        return true;
    },

    /**
     * Fetch Content (Metadata or Binary -> Base64)
     */
    getReportContent: async (childId, reportId) => {
        const response = await healthRecordsService._fetchWithAuth(`/reports/children/${childId}/reports/${reportId}`);

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || 'Retrieval failed');
        }

        const contentType = response.headers.get('content-type') || '';

        // Handle JSON metadata or raw Data URIs sent as text
        if (contentType.includes('text') || contentType.includes('json')) {
            const text = await response.text();
            try {
                return JSON.parse(text); // Try parse if metadata
            } catch {
                return text; // Return as is if already a Data URI
            }
        }

        // Handle raw binary blobs
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },
};
