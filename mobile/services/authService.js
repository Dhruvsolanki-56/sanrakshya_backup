import { apiClient } from './apiClient';
import { storage } from './storage';
import { doctorAuthService } from './doctor/doctorAuthService';

function extractTokenAndExpiry(data) {
  const token = data?.access_token || data?.token || null;
  const expiresAt = data?.expires_at || null;
  let expiresIn = null;
  if (typeof data?.expires_in === 'number') {
    expiresIn = data.expires_in;
  } else if (expiresAt) {
    const expMs = new Date(expiresAt).getTime() - Date.now();
    if (expMs > 0) expiresIn = Math.floor(expMs / 1000);
  }
  return { token, expiresIn, expiresAt };
}

export const authService = {
  async login(role, email, password) {
    const data =
      role === 'parent'
        ? await apiClient.post('/auth/parent-login', { email, password })
        : await doctorAuthService.loginDoctor(email, password);
    const { token, expiresIn, expiresAt } = extractTokenAndExpiry(data);
    if (!token) throw new Error('Invalid login response.');
    // Always overwrite token using backend expiry if available
    await storage.saveToken(token, { expiresInSeconds: expiresIn, expiresAt });
    await storage.saveRole(role);
    console.log(token);
    if (role !== 'parent') {
      try {
        await storage.clearParentHome();
      } catch (_) {}
      try {
        await storage.clearSelectedChildId();
      } catch (_) {}
    }
    return data;
  },
  async logout() {
    await storage.clearAll();
  },
};
