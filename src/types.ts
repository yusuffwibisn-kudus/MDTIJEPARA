export type Role = 'admin' | 'pantau';

export interface User {
  username: string;
  name: string;
  role: Role;
}

export type MemberCategory = string;

export interface CategoryItem {
  id: string;
  name: string;
  type?: 'kelompok' | 'kategori';
  description?: string;
  createdAt?: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  address: string;
  joinDate: string; // YYYY-MM-DD
  category: MemberCategory; // Stores Kelompok or legacy category
  kelompok?: string; // Explicit Kelompok name (e.g. Kelompok Backup A)
  kategori?: string; // Explicit Kategori name (e.g. Donatur Utama, Reguler)
  notes?: string;
  createdAt: string;
}

export type JenisJariyah = 'Jariyah Backup' | 'Wakaf' | 'Wull';

export interface JariyahSetoran {
  id: string;
  memberId: string;
  month: number; // 1 - 12
  year: number;  // e.g. 2026
  amount: number; // Rupiah nominal
  jenisJariyah?: JenisJariyah | string; // Jenis Jariyah: Jariyah Backup, Wakaf, Wull
  dateSubmitted: string; // YYYY-MM-DD
  recordedBy: string; // Admin username who recorded
  notes?: string;
}

export interface JariyahSummary {
  memberId: string;
  memberName: string;
  category: MemberCategory;
  phone: string;
  totalThisMonth: number;
  totalThisYear: number;
  totalAllTime: number;
  hasPaidThisMonth: boolean;
  lastPaymentDate?: string;
}

export interface FilterOptions {
  month: number; // 0 = all
  year: number;  // 0 = all
  category: string; // 'all' or specific category
  searchQuery: string;
  sortBy: 'name' | 'totalThisMonth' | 'totalThisYear' | 'totalAllTime' | 'joinDate';
  sortOrder: 'asc' | 'desc';
}
