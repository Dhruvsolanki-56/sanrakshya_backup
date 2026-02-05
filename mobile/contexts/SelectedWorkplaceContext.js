import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { doctorService } from '../services/doctor/doctorService';
import { storage } from '../services/storage';

const SelectedWorkplaceContext = createContext(null);

const mapWorkplaces = (workplaceRoles) => {
  if (!Array.isArray(workplaceRoles)) return [];
  return workplaceRoles
    .map((x) => ({
      role_id: x?.role_id ?? x?.id,
      place_id: x?.place_id ?? x?.id,
      place_name: x?.place_name ?? x?.name,
      place_type: x?.place_type ?? x?.type,
      place_is_verified: x?.place_is_verified ?? x?.is_verified,
      role: x?.role,
      role_status: x?.role_status,
      role_doc_attempts_count: x?.role_doc_attempts_count,
      role_latest_document: x?.role_latest_document || null,
    }))
    .filter((x) => x.place_id != null);
};

export const SelectedWorkplaceProvider = ({ children }) => {
  const [workplaces, setWorkplaces] = useState([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState(null);
  const [loadingWorkplaces, setLoadingWorkplaces] = useState(true);
  const [switchingWorkplace, setSwitchingWorkplace] = useState(false);
  const [error, setError] = useState(null);

  const loadWorkplaces = useCallback(async () => {
    setLoadingWorkplaces(true);
    setError(null);
    try {
      const data = await doctorService.getDoctorHome();
      const rolesRaw = Array.isArray(data?.workplace_roles)
        ? data.workplace_roles
        : Array.isArray(data?.workplaces)
          ? data.workplaces
          : [];

      const mapped = mapWorkplaces(rolesRaw);
      setWorkplaces(mapped);

      if (!mapped.length) {
        setSelectedWorkplaceId(null);
        await storage.clearSelectedDoctorWorkplaceId();
        return;
      }

      const storedId = await storage.getSelectedDoctorWorkplaceId();
      const initial = mapped.find((w) => String(w.place_id) === String(storedId)) || mapped[0];

      setSelectedWorkplaceId(initial.place_id);
      if (!storedId || String(storedId) !== String(initial.place_id)) {
        await storage.saveSelectedDoctorWorkplaceId(initial.place_id);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load workplaces');
      setWorkplaces([]);
      setSelectedWorkplaceId(null);
    } finally {
      setLoadingWorkplaces(false);
    }
  }, []);

  useEffect(() => {
    loadWorkplaces();
  }, [loadWorkplaces]);

  const selectWorkplace = useCallback(async (placeId) => {
    setSwitchingWorkplace(true);
    try {
      setSelectedWorkplaceId(placeId);
      await storage.saveSelectedDoctorWorkplaceId(placeId);
    } finally {
      setSwitchingWorkplace(false);
    }
  }, []);

  const selectedWorkplace = useMemo(
    () => workplaces.find((w) => String(w.place_id) === String(selectedWorkplaceId)) || null,
    [workplaces, selectedWorkplaceId]
  );

  const value = useMemo(
    () => ({
      workplaces,
      selectedWorkplace,
      selectedWorkplaceId,
      loadingWorkplaces,
      switchingWorkplace,
      error,
      reloadWorkplaces: loadWorkplaces,
      selectWorkplace,
    }),
    [
      workplaces,
      selectedWorkplace,
      selectedWorkplaceId,
      loadingWorkplaces,
      switchingWorkplace,
      error,
      loadWorkplaces,
      selectWorkplace,
    ]
  );

  return (
    <SelectedWorkplaceContext.Provider value={value}>
      {children}
    </SelectedWorkplaceContext.Provider>
  );
};

export const useSelectedWorkplace = () => {
  const ctx = useContext(SelectedWorkplaceContext);
  if (!ctx) {
    throw new Error('useSelectedWorkplace must be used within SelectedWorkplaceProvider');
  }
  return ctx;
};
