import { apiClient } from '../apiClient';

export const doctorAuthService = {
  registerDoctor: async (payload) => apiClient.post('/doctor/auth/register-doctor', payload),
  loginDoctor: async (email, password) => apiClient.post('/doctor/auth/doctor-login', { email, password }),
};
