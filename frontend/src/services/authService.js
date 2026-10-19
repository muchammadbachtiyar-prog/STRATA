import { callAppsScript } from './scriptRun.js';

// Compatibility shim: mode internal tidak memakai session/token.
export const getSessionToken = () => '';
export const clearSessionToken = () => {};

export const loginWithPassword = async (username, password) => {
  const response = await callAppsScript('loginWithPassword', [username, password]);
  if (!response || !response.success || !response.user) {
    throw new Error(response?.message || 'Username atau password salah.');
  }
  return response;
};

export const validateStoredSession = async () => ({
  success: false,
  authenticated: false,
  code: 'SESSION_DISABLED'
});

export const revokeCurrentSession = async () => ({
  success: true,
  message: 'Logout berhasil.'
});
