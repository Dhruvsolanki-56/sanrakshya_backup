import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const TOKEN_EXP_KEY = 'auth_token_exp';
const USER_ROLE_KEY = 'user_role';
const CHILD_ID_KEY = 'selected_child_id';
const DOCTOR_WORKPLACE_ID_KEY = 'selected_doctor_workplace_id';
const PARENT_HOME_KEY = 'parent_home_data';

export const storage = {
  /**
   * Save auth token.
   * - token: access token string
   * - options.expiresInSeconds: optional relative expiry (seconds)
   * - options.expiresAt: optional absolute ISO expiry from backend (e.g. "2026-01-06T14:12:01.019Z")
   */
  async saveToken(token, options = {}) {
    const { expiresInSeconds, expiresAt } = options || {};
    let expMs;
    if (expiresAt) {
      const parsed = Date.parse(expiresAt);
      if (!Number.isNaN(parsed)) {
        expMs = parsed;
      }
    }
    if (!expMs) {
      const now = Date.now();
      expMs = expiresInSeconds ? now + expiresInSeconds * 1000 : now + 3600 * 1000; // default 1h
    }
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [TOKEN_EXP_KEY, String(expMs)],
    ]);
  },
  async saveRole(role) {
    await AsyncStorage.setItem(USER_ROLE_KEY, role);
  },
  async saveSelectedChildId(childId) {
    try {
      await AsyncStorage.setItem(CHILD_ID_KEY, String(childId));
    } catch (_) {}
  },
  async saveSelectedDoctorWorkplaceId(placeId) {
    try {
      await AsyncStorage.setItem(DOCTOR_WORKPLACE_ID_KEY, String(placeId));
    } catch (_) {}
  },
  async getSelectedChildId() {
    try {
      const v = await AsyncStorage.getItem(CHILD_ID_KEY);
      return v || null;
    } catch (_) {
      return null;
    }
  },
  async getSelectedDoctorWorkplaceId() {
    try {
      const v = await AsyncStorage.getItem(DOCTOR_WORKPLACE_ID_KEY);
      return v || null;
    } catch (_) {
      return null;
    }
  },
  async clearSelectedChildId() {
    try {
      await AsyncStorage.removeItem(CHILD_ID_KEY);
    } catch (_) {}
  },
  async clearSelectedDoctorWorkplaceId() {
    try {
      await AsyncStorage.removeItem(DOCTOR_WORKPLACE_ID_KEY);
    } catch (_) {}
  },
  async getToken() {
    const [token, expStr] = await AsyncStorage.multiGet([TOKEN_KEY, TOKEN_EXP_KEY]).then((pairs) => pairs.map(([, v]) => v));
    if (!token || !expStr) return null;
    const exp = Number(expStr);
    if (!exp || Date.now() >= exp) {
      // Token is expired; clear everything so app resets cleanly
      await this.clearAll();
      return null;
    }
    return token;
  },
  async getTokenWithMeta() {
    const pairs = await AsyncStorage.multiGet([TOKEN_KEY, TOKEN_EXP_KEY, USER_ROLE_KEY]);
    const map = Object.fromEntries(pairs);
    const token = map[TOKEN_KEY];
    const exp = Number(map[TOKEN_EXP_KEY]);
    const role = map[USER_ROLE_KEY] || null;
    if (!token || !exp || Date.now() >= exp) {
      await this.clearAll();
      return { token: null, exp: null, role: null };
    }
    return { token: token || null, exp: exp || null, role };
  },
  async clearToken() {
    await AsyncStorage.multiRemove([TOKEN_KEY, TOKEN_EXP_KEY, PARENT_HOME_KEY]);
  },
  async clearAll() {
    await AsyncStorage.multiRemove([TOKEN_KEY, TOKEN_EXP_KEY, USER_ROLE_KEY, CHILD_ID_KEY, DOCTOR_WORKPLACE_ID_KEY, PARENT_HOME_KEY]);
  },
  async saveParentHome(data) {
    try {
      await AsyncStorage.setItem(PARENT_HOME_KEY, JSON.stringify(data));
    } catch (_) {}
  },
  async getParentHome() {
    try {
      const meta = await this.getTokenWithMeta();
      const token = meta?.token;
      const exp = meta?.exp;
      if (!token || !exp || Date.now() >= exp) {
        await this.clearToken();
        try {
          await AsyncStorage.removeItem(PARENT_HOME_KEY);
        } catch (_) {}
        return null;
      }
      const raw = await AsyncStorage.getItem(PARENT_HOME_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  },
  async clearParentHome() {
    try {
      await AsyncStorage.removeItem(PARENT_HOME_KEY);
    } catch (_) {}
  },
};

export const enums = {
  Gender: ['Male', 'Female'],
  BloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
};
