import type { QuickFilterType } from '../types/laporan';

/**
 * Format a Date object to YYYY-MM-DD string for HTML <input type="date">
 */
export function formatDateToInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format YYYY-MM-DD or ISO string to Indonesian display format e.g. "1 Okt 2023"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const monthsIndo = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const day = date.getDate();
  const month = monthsIndo[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Calculate date range for quick filters
 */
export function getQuickFilterDates(filter: QuickFilterType): { startDate: string; endDate: string } {
  const today = new Date();
  const endDateStr = formatDateToInput(today);

  if (filter === '7_hari') {
    const startDate = new Date();
    startDate.setDate(today.getDate() - 6);
    return {
      startDate: formatDateToInput(startDate),
      endDate: endDateStr,
    };
  }

  if (filter === 'bulan_ini') {
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      startDate: formatDateToInput(startDate),
      endDate: endDateStr,
    };
  }

  if (filter === 'kuartal_terakhir') {
    // Current quarter start - 3 months
    const currentQuarter = Math.floor(today.getMonth() / 3);
    const prevQuarterStartMonth = (currentQuarter === 0 ? 3 : currentQuarter - 1) * 3;
    const year = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear();
    const startDate = new Date(year, prevQuarterStartMonth, 1);
    const endDate = new Date(year, prevQuarterStartMonth + 3, 0);

    return {
      startDate: formatDateToInput(startDate),
      endDate: formatDateToInput(endDate),
    };
  }

  return { startDate: '', endDate: '' };
}

/**
 * Helper to display period summary string
 */
export function formatPeriodSummary(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return 'All Periods';
  return `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
}

/**
 * Generates current datetime string for history entry
 */
export function getCurrentFormattedDateTime(): string {
  const now = new Date();
  const displayDate = formatDateDisplay(formatDateToInput(now));
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${displayDate}, ${hours}:${minutes}`;
}
