import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { storage } from '../services/storage';
import { userService } from '../services/userService';

// Lightweight mapper for children from /users/parent-home so all screens
// can share a consistent child shape.
const mapChildren = async (apiChildren = []) => {
  return Promise.all(apiChildren.map(async (c, idx) => {
    const yearsFromApi = typeof c.age_years === 'number' ? c.age_years : null;
    const monthsFromApi = typeof c.age_months === 'number' ? c.age_months : null;
    const years = yearsFromApi != null ? yearsFromApi : 0;
    const months = monthsFromApi != null ? monthsFromApi : 0;

    const ageText =
      yearsFromApi != null || monthsFromApi != null
        ? `${years} ${years === 1 ? 'year' : 'years'} ${months} ${
            months === 1 ? 'month' : 'months'
          }`
        : '';

    const genderRaw = c.gender || null;
    let genderLabel = null;
    if (typeof genderRaw === 'string' && genderRaw.trim().length) {
      const g = genderRaw.trim().toLowerCase();
      if (g === 'male' || g === 'm' || g === 'boy') genderLabel = 'Boy';
      else if (g === 'female' || g === 'f' || g === 'girl') genderLabel = 'Girl';
      else genderLabel = genderRaw.trim();
    }

    const id = String(c.child_id || idx + 1);
    let avatar;
    let avatarSource;
    try {
      const src = await userService.getChildPhotoSource(id, c.photo_url || c.avatar_url || null);
      avatarSource = src || undefined;
      avatar = src?.uri;
    } catch (_) {
      avatar = undefined;
      avatarSource = undefined;
    }

    return {
      id,
      name: c.name || c.full_name || 'Child',
      dobRaw: c.date_of_birth || c.dob || null,
      avatar,
      avatarSource,
      ageYears: yearsFromApi,
      ageMonths: monthsFromApi,
      ageText,
      gender: genderRaw,
      genderLabel,
      bloodGroup: c.blood_group || c.bloodGroup || null,
    };
  }));
};

const SelectedChildContext = createContext(null);

export const SelectedChildProvider = ({ children }) => {
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [switchingChild, setSwitchingChild] = useState(false);
  const [error, setError] = useState(null);

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    setError(null);
    try {
      const meta = await storage.getTokenWithMeta();
      const role = meta?.role;
      const token = meta?.token;

      // Only parents can load /users/parent-home. Avoid hitting the endpoint before login
      // (or when logged in as doctor) to prevent stale/incorrect child context.
      if (!token || role !== 'parent') {
        setChildrenList([]);
        setSelectedChildId(null);
        await storage.clearSelectedChildId();
        return;
      }

      const data = await userService.getParentHome();
      const mapped = await mapChildren(data?.children || []);
      setChildrenList(mapped);

      if (!mapped.length) {
        setSelectedChildId(null);
        await storage.clearSelectedChildId();
        return;
      }

      const storedId = await storage.getSelectedChildId();
      const initial =
        mapped.find((c) => String(c.id) === String(storedId)) || mapped[0];

      setSelectedChildId(initial.id);
      if (!storedId || String(storedId) !== String(initial.id)) {
        await storage.saveSelectedChildId(initial.id);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load children');
    } finally {
      setLoadingChildren(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const selectChild = useCallback(async (id) => {
    setSwitchingChild(true);
    try {
      setSelectedChildId(id);
      await storage.saveSelectedChildId(id);
    } finally {
      setSwitchingChild(false);
    }
  }, []);

  const selectedChild = useMemo(
    () =>
      childrenList.find((c) => String(c.id) === String(selectedChildId)) || null,
    [childrenList, selectedChildId]
  );

  const value = useMemo(
    () => ({
      children: childrenList,
      selectedChild,
      selectedChildId,
      loadingChildren,
      switchingChild,
      error,
      reloadChildren: loadChildren,
      selectChild,
    }),
    [
      childrenList,
      selectedChild,
      selectedChildId,
      loadingChildren,
      switchingChild,
      error,
      loadChildren,
      selectChild,
    ]
  );

  return (
    <SelectedChildContext.Provider value={value}>
      {children}
    </SelectedChildContext.Provider>
  );
};

export const useSelectedChild = () => {
  const ctx = useContext(SelectedChildContext);
  if (!ctx) {
    throw new Error('useSelectedChild must be used within SelectedChildProvider');
  }
  return ctx;
};
