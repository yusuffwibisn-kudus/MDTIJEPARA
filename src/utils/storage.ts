import { Member, JariyahSetoran, CategoryItem, Role, User } from '../types';
import { INITIAL_MEMBERS, INITIAL_SETORAN, INITIAL_CATEGORIES } from '../data/initialData';

const MEMBERS_STORAGE_KEY = 'sipenja_members_v1';
const SETORAN_STORAGE_KEY = 'sipenja_setoran_v1';
const CATEGORIES_STORAGE_KEY = 'sipenja_categories_v2';
const AUTH_STORAGE_KEY = 'sipenja_auth_user_v2';
const ADMIN_PASSWORD_KEY = 'sipenja_admin_password_v2';

export const DEFAULT_ADMIN_EMAIL = 'mdtijepara@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = 'admin123';

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

export function getStoredAuthUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to get auth user', err);
    return null;
  }
}

export function saveStoredAuthUser(user: User | null): void {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
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
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(INITIAL_MEMBERS));
      return INITIAL_MEMBERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse stored members', err);
    return INITIAL_MEMBERS;
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
    if (Array.isArray(parsed) && parsed.some((s: JariyahSetoran) => s.id && s.id.startsWith('set-'))) {
      const filtered = parsed.filter((s: JariyahSetoran) => !s.id.startsWith('set-'));
      localStorage.setItem(SETORAN_STORAGE_KEY, JSON.stringify(filtered));
      return filtered;
    }
    return parsed;
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
  localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(INITIAL_MEMBERS));
  localStorage.setItem(SETORAN_STORAGE_KEY, JSON.stringify(INITIAL_SETORAN));
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES));
  return { members: INITIAL_MEMBERS, setoran: INITIAL_SETORAN, categories: INITIAL_CATEGORIES };
}
