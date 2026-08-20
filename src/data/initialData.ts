import { Member, JariyahSetoran, CategoryItem } from '../types';

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: 'cat-1',
    name: 'Kelompok Backup A',
    type: 'kelompok',
    description: 'Minimal setoran Jariyah Backup Rp 1.000.000 / bulan',
    createdAt: '2024-01-01T08:00:00.000Z',
  },
  {
    id: 'cat-2',
    name: 'Kelompok Backup B',
    type: 'kelompok',
    description: 'Minimal setoran Jariyah Backup Rp 500.000 / bulan',
    createdAt: '2024-01-01T08:00:00.000Z',
  },
  {
    id: 'cat-3',
    name: 'Kelompok Backup C',
    type: 'kelompok',
    description: 'Minimal setoran Jariyah Backup Rp 300.000 / bulan',
    createdAt: '2024-01-01T08:00:00.000Z',
  },
  {
    id: 'cat-4',
    name: 'Kelompok Backup D',
    type: 'kelompok',
    description: 'Minimal setoran Jariyah Backup Rp 200.000 / bulan',
    createdAt: '2024-01-01T08:00:00.000Z',
  },
  {
    id: 'cat-5',
    name: 'Kelompok Backup E',
    type: 'kelompok',
    description: 'Minimal setoran Jariyah Backup Rp 100.000 / bulan',
    createdAt: '2024-01-01T08:00:00.000Z',
  },
  {
    id: 'cat-6',
    name: 'Kelompok Soko Tatal',
    type: 'kelompok',
    description: 'Setoran seikhlasnya (dibawah Rp 100.000 atau lebih)',
    createdAt: '2024-01-01T08:00:00.000Z',
  },
];

export const INITIAL_MEMBERS: Member[] = [];

// Initial setoran history (defaults to empty so total balances start at Rp 0 when cleared)
export const INITIAL_SETORAN: JariyahSetoran[] = [];
