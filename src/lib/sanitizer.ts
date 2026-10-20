/**
 * Utility functions for security, output encoding, and CSV formula injection prevention.
 */

// Formula injection characters in spreadsheet applications (Excel, LibreOffice, Google Sheets)
const CSV_INJECTION_REGEX = /^[=+\-@\t\r]/;

/**
 * Escapes untrusted text before exporting to CSV/spreadsheet formats.
 * If the string begins with =, +, -, @, tab, or carriage return, it prepends a single quote.
 * It also escapes quotes by doubling them per RFC 4180.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // If text starts with dangerous formula trigger, prepend single quote
  if (CSV_INJECTION_REGEX.test(str)) {
    str = `'${str}`;
  }

  // Double quotes inside string per CSV RFC 4180
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates an RFC 4180 compliant CSV string from an array of objects.
 */
export function generateSafeCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

/**
 * Basic HTML output encoder for preventing XSS in raw injection contexts.
 */
export function encodeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates whether a URL is a safe http or https URL.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
