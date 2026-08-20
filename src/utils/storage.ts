import { Member, JariyahSetoran, CategoryItem, Role, User } from '../types';
import { INITIAL_MEMBERS, INITIAL_SETORAN, INITIAL_CATEGORIES } from '../data/initialData';

const MEMBERS_STORAGE_KEY = 'sipenja_members_clean_prod_v3';
const SETORAN_STORAGE_KEY = 'sipenja_setoran_clean_prod_v3';
const CATEGORIES_STORAGE_KEY = 'sipenja_categories_clean_prod_v3';
const AUTH_STORAGE_KEY = 'sipenja_auth_user_clean_prod_v3';
const ADMIN_PASSWORD_KEY = 'sipenja_admin_password_v2';

export const DEFAULT_ADMIN_EMAIL = 'mdtijepara@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = 'admin123';

export const DEFAULT_PANTAU_USER: User = {
  username: 'pengawas',
  name: 'Tim Pengawas / Tamu',
  role: 'pantau',
};

// Cleanup old legacy keys
try {
  ['sipenja_members_v1', 'sipenja_setoran_v1', 'sipenja_members_prod_v2', 'sipenja_setoran_prod_v2'].forEach((k) => {
    localStorage.removeItem(k);
  });
} catch (e) {
  // ignore
}

export function getStoredAdminPassword(): string {
  try {
    const saved = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (!saved) {
      localStorage.setItem(ADMIN_PASSWORD_KEY, DEFAULT_ADMIN_PASSWORD);
      return DEFAULT_ADMIN_PASSWORD;
    }
    return saved;
  } catch (err) {
    console.error('Failed to get stored password', err);
    return DEFAULT_ADMIN_PASSWORD;
  }
}

export function saveAdminPassword(newPassword: string): void {
  try {
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
  } catch (err) {
    console.error('Failed to save new password', err);
  }
}

export function getStoredAuthUser(): User {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return DEFAULT_PANTAU_USER;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.role) return DEFAULT_PANTAU_USER;
    return parsed;
  } catch (err) {
    console.error('Failed to get auth user', err);
    return DEFAULT_PANTAU_USER;
  }
}

export function saveStoredAuthUser(user: User | null): void {
  try {
    if (!user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_PANTAU_USER));
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Failed to save auth user', err);
  }
}

export function getStoredCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse stored categories', err);
    return INITIAL_CATEGORIES;
  }
}

export function saveCategories(categories: CategoryItem[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories', err);
  }
}

export function getStoredMembers(): Member[] {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // If legacy demo member names exist, return empty array
      const hasDemo = parsed.some((m: any) => m.id === 'mbr-1' || m.name === 'H. Ahmad Dahlan' || m.id === 'mbr-2');
      if (hasDemo) {
        localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to parse stored members', err);
    return [];
  }
}

export function saveMembers(members: Member[]): void {
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  } catch (err) {
    console.error('Failed to save members', err);
  }
}

export function getStoredSetoran(): JariyahSetoran[] {
  try {
    const raw = localStorage.getItem(SETORAN_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETORAN_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const hasDemo = parsed.some((s: any) => s.id && (s.id.startsWith('set-') || s.memberId === 'mbr-1'));
      if (hasDemo) {
        const filtered = parsed.filter((s: any) => !s.id?.startsWith('set-') && s.memberId !== 'mbr-1');
        localStorage.setItem(SETORAN_STORAGE_KEY, JSON.stringify(filtered));
        return filtered;
      }
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to parse stored setoran', err);
    return [];
  }
}

export function saveSetoran(setoranList: JariyahSetoran[]): void {
  try {
    localStorage.setItem(SETORAN_STORAGE_KEY, JSON.stringify(setoranList));
  } catch (err) {
    console.error('Failed to save setoran', err);
  }
}

export function resetToSeedData(): { members: Member[]; setoran: JariyahSetoran[]; categories: CategoryItem[] } {
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(SETORAN_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
  return { members: [], setoran: [], categories: INITIAL_CATEGORIES };
}

export function clearAllTransactionData(): void {
  try {
    localStorage.setItem(SETORAN_STORAGE_KEY, JSON.stringify([]));
  } catch (err) {
    console.error('Failed to clear transaction data', err);
  }
}

export function clearAllDatabaseForProduction(): { members: Member[]; setoran: JariyahSetoran[]; categories: CategoryItem[] } {
  try {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(SETORAN_STORAGE_KEY, JSON.stringify([]));
    const currentCategories = getStoredCategories();
    return { members: [], setoran: [], categories: currentCategories };
  } catch (err) {
    console.error('Failed to clear database for production', err);
    return { members: [], setoran: [], categories: [] };
  }
}

export function exportFullDatabaseBackup(): string {
  const data = {
    appName: 'MDTI PASEBAN AGUNG JEPARA',
    version: '2.4.0',
    exportedAt: new Date().toISOString(),
    members: getStoredMembers(),
    setoran: getStoredSetoran(),
    categories: getStoredCategories(),
  };
  return JSON.stringify(data, null, 2);
}

export function importFullDatabaseBackup(jsonString: string): { success: boolean; message: string; data?: { members: Member[]; setoran: JariyahSetoran[]; categories: CategoryItem[] } } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || (!Array.isArray(parsed.members) && !Array.isArray(parsed.setoran))) {
      return { success: false, message: 'Format file JSON cadangan tidak valid.' };
    }

    const members: Member[] = Array.isArray(parsed.members) ? parsed.members : [];
    const setoran: JariyahSetoran[] = Array.isArray(parsed.setoran) ? parsed.setoran : [];
    const categories: CategoryItem[] = Array.isArray(parsed.categories) ? parsed.categories : getStoredCategories();

    saveMembers(members);
    saveSetoran(setoran);
    saveCategories(categories);

    return {
      success: true,
      message: `Berhasil memulihkan ${members.length} data anggota dan ${setoran.length} transaksi setoran.`,
      data: { members, setoran, categories }
    };
  } catch (err) {
    return { success: false, message: 'Gagal memproses file JSON cadangan: format rusak.' };
  }
}
