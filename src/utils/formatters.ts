/**
 * Utility functions for formatting member fields as per PACCS standards
 */

/**
 * Formats mobile numbers into 5 digits - 5 digits format
 * Example: "9842156789" -> "98421 - 56789"
 */
export function formatMobile(val?: string | null): string {
  if (!val || !val.trim()) return '-';
  const digits = val.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `${digits.slice(0, 5)} - ${digits.slice(5, 10)}${digits.length > 10 ? ' ' + digits.slice(10) : ''}`;
  }
  if (digits.length > 5) {
    return `${digits.slice(0, 5)} - ${digits.slice(5)}`;
  }
  return val.trim();
}

/**
 * Formats Aadhar number into 12 digits max, grouped as 4-4-4 digits
 * Example: "123423344543" -> "1234 - 2334 - 4543"
 */
export function formatAadhar(val?: string | null): string {
  if (!val || !val.trim()) return '-';
  const digits = val.replace(/\D/g, '').slice(0, 12);
  if (!digits) return val.trim();
  const chunks: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    chunks.push(digits.slice(i, i + 4));
  }
  return chunks.join(' - ');
}

/**
 * Formats Ration Card numbers:
 * Left side of hyphen: Uppercase letters (e.g., NPHH)
 * Right side of hyphen: 12 digits max, grouped into 3-digit blocks
 * Example: "NPHH123000111222" -> "NPHH - 123 - 000 - 111 - 222"
 */
export function formatRationCard(val?: string | null): string {
  if (!val || !val.trim()) return '-';
  const str = val.trim().toUpperCase();

  const dashIndex = str.indexOf('-');
  let prefix = '';
  let rest = str;

  if (dashIndex !== -1) {
    prefix = str.slice(0, dashIndex).trim();
    rest = str.slice(dashIndex + 1);
  } else {
    const letterMatch = str.match(/^([A-Z\/]+)/);
    if (letterMatch) {
      prefix = letterMatch[1];
      rest = str.slice(prefix.length);
    }
  }

  const digits = rest.replace(/\D/g, '').slice(0, 12);

  if (digits.length > 0) {
    const chunks: string[] = [];
    for (let i = 0; i < digits.length; i += 3) {
      chunks.push(digits.slice(i, i + 3));
    }
    const formattedDigits = chunks.join(' - ');
    return prefix ? `${prefix} - ${formattedDigits}` : formattedDigits;
  }

  return prefix || str;
}

/**
 * Formats MDCC numbers:
 * 1. Capitalizes letters
 * 2. Groups digits into 3-digit blocks separated by dashes
 * Example: "MDCC-7821" -> "MDCC-782 - 1" or "7821" -> "782 - 1"
 */
export function formatMDCC(val?: string | null): string {
  if (!val || !val.trim()) return '-';
  let str = val.trim().toUpperCase();

  return str.replace(/\d+/g, (match) => {
    if (match.length <= 3) return match;
    const chunks: string[] = [];
    for (let i = 0; i < match.length; i += 3) {
      chunks.push(match.slice(i, i + 3));
    }
    return chunks.join(' - ');
  });
}

/**
 * Formats Total Share into Indian Number System with comma separation
 * Example: 100000 -> "₹ 1,00,000" or "1,00,000"
 */
export function formatIndianCurrency(val?: number | string | null, includeSymbol = true): string {
  if (val === null || val === undefined || val === '') return includeSymbol ? '₹ 0.00' : '0.00';
  let num: number;
  if (typeof val === 'number') {
    num = val;
  } else {
    const cleanStr = String(val).replace(/[^0-9.-]/g, '');
    num = parseFloat(cleanStr);
  }
  if (isNaN(num)) return String(val);

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = absNum.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });

  const sign = isNegative ? '-' : '';
  return includeSymbol ? `${sign}₹ ${formatted}` : `${sign}${formatted}`;
}

/**
 * Formats raw input for Indian comma separated numbers live in text fields
 * Example input "100000" -> "1,00,000"
 */
export function formatIndianInputNumber(val: string): string {
  if (!val) return '';
  const cleanDigits = val.replace(/[^0-9]/g, '');
  if (!cleanDigits) return '';
  const num = parseInt(cleanDigits, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-IN');
}

/**
 * Formats a date string, ISO string, or digit string into DD-MM-YYYY format
 * Example: "2026-05-10T18:30:00.000Z" -> "10-05-2026"
 * Example: "15042026" -> "15-04-2026"
 */
export function formatDateDDMMYYYY(val?: string | null): string {
  if (!val || !val.trim() || val === '-') return '-';
  const cleanStr = val.trim();

  // If ISO string like 2026-05-10T18:30:00.000Z
  if (cleanStr.includes('T')) {
    const isoPart = cleanStr.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoPart)) {
      const [y, m, d] = isoPart.split('-');
      return `${d}-${m}-${y}`;
    }
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const [y, m, d] = cleanStr.split('-');
    return `${d}-${m}-${y}`;
  }

  // If already DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(cleanStr)) {
    const parts = cleanStr.split(/[-/]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${day}-${month}-${year}`;
  }

  // Standard Date parse
  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Fallback for raw digits like 15042026
  const digits = cleanStr.replace(/\D/g, '').slice(0, 8);
  if (!digits) return cleanStr;
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
}

/**
 * Extracts clean Google Spreadsheet ID from a URL or raw ID string.
 * Example: "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?gid=0#gid=0"
 * -> "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
 */
export function extractSpreadsheetId(input?: string | null): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.includes('/d/')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) return match[1];
  }
  return trimmed;
}

/**
 * Formats Land Area / Acres (பரப்பு ஏ.செ) with exactly 2 decimal places.
 * Example: 2.5 -> "2.50", "2" -> "2.00", "0" -> "0.00"
 */
export function formatAcres(val?: number | string | null): string {
  if (val === null || val === undefined || val === '') return '0.00';
  const cleanStr = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleanStr);
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

