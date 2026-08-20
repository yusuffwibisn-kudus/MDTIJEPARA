export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const INDONESIAN_CATEGORIES = [
  'Kelompok Backup A',
  'Kelompok Backup B',
  'Kelompok Backup C',
  'Kelompok Backup D',
  'Kelompok Backup E',
  'Kelompok Soko Tatal',
  'Donatur Utama',
  'Reguler'
] as const;

/**
 * Returns minimum Jariyah Backup amount required for a category/kelompok to be marked "Lunas".
 * - Backup A: Rp 1.000.000
 * - Backup B: Rp 500.000
 * - Backup C: Rp 300.000
 * - Backup D: Rp 200.000
 * - Backup E: Rp 100.000
 * - Soko Tatal: > 0 (dibawah Rp 100.000 atau lebih / seikhlasnya)
 */
export type CategoryOrMember = string | { category?: string; kelompok?: string; kategori?: string } | null | undefined;

export function getRequiredJariyahBackupMin(categoryInput: CategoryOrMember): number {
  if (!categoryInput) return 1;

  let text = '';
  if (typeof categoryInput === 'string') {
    text = categoryInput;
  } else {
    text = `${categoryInput.category || ''} ${categoryInput.kelompok || ''} ${categoryInput.kategori || ''}`;
  }

  const cat = text.trim().toUpperCase();

  if (
    cat.includes('BACKUP A') ||
    cat.includes('KATEGORI A') ||
    cat.includes('KELOMPOK BACKUP A')
  ) {
    return 1000000;
  }
  if (
    cat.includes('BACKUP B') ||
    cat.includes('KATEGORI B') ||
    cat.includes('KELOMPOK BACKUP B')
  ) {
    return 500000;
  }
  if (
    cat.includes('BACKUP C') ||
    cat.includes('KATEGORI C') ||
    cat.includes('KELOMPOK BACKUP C')
  ) {
    return 300000;
  }
  if (
    cat.includes('BACKUP D') ||
    cat.includes('KATEGORI D') ||
    cat.includes('KELOMPOK BACKUP D')
  ) {
    return 200000;
  }
  if (
    cat.includes('BACKUP E') ||
    cat.includes('KATEGORI E') ||
    cat.includes('KELOMPOK BACKUP E')
  ) {
    return 100000;
  }
  if (cat.includes('SOKO TATAL')) {
    return 1;
  }

  // Secondary regex fallback for standalone 'A', 'B', 'C', 'D', 'E' or 'KELOMPOK A'
  if (cat.includes('KELOMPOK A') || /\bA\b/.test(cat)) {
    return 1000000;
  }
  if (cat.includes('KELOMPOK B') || /\bB\b/.test(cat)) {
    return 500000;
  }
  if (cat.includes('KELOMPOK C') || /\bC\b/.test(cat)) {
    return 300000;
  }
  if (cat.includes('KELOMPOK D') || /\bD\b/.test(cat)) {
    return 200000;
  }
  if (cat.includes('KELOMPOK E') || /\bE\b/.test(cat)) {
    return 100000;
  }

  return 1;
}

export function isSetoranLunas(
  categoryInput: CategoryOrMember,
  backupAmount: number,
  totalAmount?: number
): boolean {
  const minRequired = getRequiredJariyahBackupMin(categoryInput);
  if (minRequired <= 1) {
    return backupAmount > 0 || (totalAmount !== undefined && totalAmount > 0);
  }
  return backupAmount >= minRequired;
}

export function getSetoranStatusInfo(
  categoryInput: CategoryOrMember,
  backupAmount: number,
  totalAmount: number
): { status: 'Lunas' | 'Belum Lunas' | 'Belum Setor'; isLunas: boolean; targetAmount: number } {
  const minRequired = getRequiredJariyahBackupMin(categoryInput);
  const isLunas = isSetoranLunas(categoryInput, backupAmount, totalAmount);

  if (isLunas) {
    return { status: 'Lunas', isLunas: true, targetAmount: minRequired };
  }

  if (backupAmount > 0 || totalAmount > 0) {
    return { status: 'Belum Lunas', isLunas: false, targetAmount: minRequired };
  }

  return { status: 'Belum Setor', isLunas: false, targetAmount: minRequired };
}

/**
 * Format number to Indonesian Rupiah (e.g., Rp 150.000)
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format compact numbers for stats (e.g. Rp 1,5 Jt or Rp 150 rb)
 */
export function formatRupiahCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace('.', ',')} Jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return formatRupiah(amount);
}

/**
 * Format date string (YYYY-MM-DD) to Indonesian format (e.g., 15 Agustus 2025)
 */
export function formatDateID(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const month = INDONESIAN_MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Get Month Name from 1-based month index (1=Januari, 12=Desember)
 */
export function getMonthName(monthNumber: number): string {
  return INDONESIAN_MONTHS[monthNumber - 1] || `Bulan ${monthNumber}`;
}

/**
 * Extract distinct Kelompok name from Member object
 */
export function getMemberKelompok(member: { category?: string; kelompok?: string; kategori?: string }): string {
  if (member.kelompok && member.kelompok.trim()) {
    return member.kelompok.trim();
  }
  if (member.category && !member.category.startsWith('Donatur') && member.category !== 'Reguler' && member.category !== 'Simpatisan') {
    return member.category.trim();
  }
  return member.category || 'Lainnya';
}

/**
 * Extract distinct Kategori name from Member object
 */
export function getMemberKategori(member: { category?: string; kelompok?: string; kategori?: string }): string {
  if (member.kategori && member.kategori.trim()) {
    return member.kategori.trim();
  }
  if (member.category === 'Donatur Utama' || member.category === 'Reguler' || member.category === 'Simpatisan') {
    return member.category;
  }
  if (member.category?.includes('Backup A') || member.category?.includes('Backup B')) {
    return 'Donatur Utama';
  }
  if (member.category?.includes('Soko Tatal')) {
    return 'Donatur Soko Tatal';
  }
  return 'Reguler';
}
