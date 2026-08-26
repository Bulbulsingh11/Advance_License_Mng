import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdvanceLicence } from '../types';

// Local storage key for fallback cache
const STORAGE_KEY = 'alok_advance_licences_master_v1';

let clientSupabaseInstance: SupabaseClient | null = null;

// Helper to filter out any mock/placeholder records
export const isMockRecord = (lic: Partial<AdvanceLicence>): boolean => {
  const mockIds = ['AL-2026-001', 'AL-2026-002', 'AL-2026-003', 'AL-2026-004'];
  const mockLicenceNumbers = ['0310789456', '0310654321', '0310998877', '0310451239'];
  const mockFileNumbers = [
    'ECA/SIL/03/2025/00142',
    'ECA/MUM/05/2024/00891',
    'ECA/VAPI/02/2026/00045',
    'ECA/SIL/03/2023/00912',
  ];

  if (lic.id && mockIds.includes(lic.id)) return true;
  if (lic.licenceNumber && mockLicenceNumbers.includes(lic.licenceNumber)) return true;
  if (lic.fileNumber && mockFileNumbers.includes(lic.fileNumber)) return true;

  return false;
};

// Optional direct client (using public anon key only)
export const getSupabase = (): SupabaseClient | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && anonKey && url.trim() !== '' && anonKey.trim() !== '') {
    if (!clientSupabaseInstance) {
      clientSupabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return clientSupabaseInstance;
  }
  return null;
};

// Local storage cache helpers (used strictly as fallback / initial fast render)
export const getLocalCacheLicences = (): AdvanceLicence[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((l) => !isMockRecord(l));
      }
    }
  } catch (e) {
    console.warn('Error reading from localStorage:', e);
  }
  return [];
};

export const syncLocalCache = (licences: AdvanceLicence[]) => {
  try {
    const cleanList = licences.filter((l) => !isMockRecord(l));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
  } catch (e) {
    console.warn('Error syncing localStorage cache:', e);
  }
};

export interface DatabaseStatusResponse {
  connected: boolean;
  source: string;
  recordsCount: number;
  tables?: string[];
  message?: string;
  error?: string;
  hint?: string;
}

/**
 * Check backend database connection status and record count
 */
export const checkDatabaseStatus = async (): Promise<DatabaseStatusResponse> => {
  try {
    const res = await fetch('/api/database/status');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        connected: false,
        source: 'error',
        recordsCount: 0,
        error: err.error || `HTTP ${res.status}`,
        hint: err.hint,
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      connected: false,
      source: 'offline',
      recordsCount: 0,
      error: err.message || 'Cannot reach API server',
    };
  }
};

/**
 * Fetch all Advance Licences from API (backed by Supabase Postgres)
 */
export const fetchLicencesFromDB = async (): Promise<{ licences: AdvanceLicence[]; source: string; isDb: boolean; hint?: string }> => {
  try {
    const res = await fetch('/api/licences');
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        const cleanList = data.data.filter((l: any) => !isMockRecord(l));
        if (cleanList.length > 0) {
          syncLocalCache(cleanList);
        }
        const combined = cleanList.length > 0 ? cleanList : getLocalCacheLicences();
        return {
          licences: combined,
          source: data.source || 'api',
          isDb: data.source === 'supabase_postgresql' && !data.fallback,
          hint: data.hint,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch from /api/licences:', err);
  }
  const fallback = getLocalCacheLicences();
  return { licences: fallback, source: 'local_storage', isDb: false };
};

/**
 * Get a single Advance Licence record by ID from API
 */
export const getLicenceFromDB = async (id: string): Promise<AdvanceLicence | null> => {
  try {
    const res = await fetch(`/api/licences/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn(`Failed to fetch licence ${id} from API:`, err);
  }
  const all = getLocalCacheLicences();
  return all.find((l) => l.id === id) || null;
};

/**
 * Save / Insert a new Advance Licence via POST /api/licences
 */
export const saveLicenceToDB = async (licence: AdvanceLicence): Promise<AdvanceLicence> => {
  try {
    const res = await fetch('/api/licences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(licence),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        const savedRecord = result.data as AdvanceLicence;
        const current = getLocalCacheLicences();
        const next = [savedRecord, ...current.filter((l) => l.id !== savedRecord.id)];
        syncLocalCache(next);
        return savedRecord;
      }
    }
  } catch (err) {
    console.warn('API save call error, saving to local cache:', err);
  }

  // Fallback to local cache if API was unreachable
  const current = getLocalCacheLicences();
  const next = [licence, ...current.filter((l) => l.id !== licence.id)];
  syncLocalCache(next);
  return licence;
};

/**
 * Update an existing Advance Licence via PUT /api/licences/:id
 */
export const updateLicenceInDB = async (licence: AdvanceLicence): Promise<AdvanceLicence> => {
  try {
    const res = await fetch(`/api/licences/${licence.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(licence),
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        const updatedRecord = result.data as AdvanceLicence;
        const current = getLocalCacheLicences();
        const next = current.map((l) => (l.id === updatedRecord.id ? updatedRecord : l));
        syncLocalCache(next);
        return updatedRecord;
      }
    }
  } catch (err) {
    console.warn('API update call error, updating local cache:', err);
  }

  const current = getLocalCacheLicences();
  const next = current.map((l) => (l.id === licence.id ? licence : l));
  syncLocalCache(next);
  return licence;
};

/**
 * Delete an Advance Licence record by ID via DELETE /api/licences/:id
 */
export const deleteLicenceFromDB = async (id: string): Promise<boolean> => {
  try {
    await fetch(`/api/licences/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (err) {
    console.warn('API delete call error, deleting from local cache:', err);
  }

  const current = getLocalCacheLicences();
  const next = current.filter((l) => l.id !== id);
  syncLocalCache(next);
  return true;
};
