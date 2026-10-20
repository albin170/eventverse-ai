import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, generateSafeCsv, encodeHtml, isSafeUrl } from '../lib/sanitizer';

describe('Sanitizer & Security Utilities', () => {
  describe('CSV Injection Prevention', () => {
    it('prepends single quote to cells beginning with dangerous characters (=, +, -, @, tab, cr)', () => {
      expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
      expect(sanitizeCsvCell('+cmd|')).toBe('"\'+cmd|"');
      expect(sanitizeCsvCell('-123')).toBe('"\' -123"'.replace(' ', ''));
      expect(sanitizeCsvCell('@cmd')).toBe('"\'@cmd"');
      expect(sanitizeCsvCell('\tmalicious')).toBe('"\'\tmalicious"');
    });

    it('preserves normal text and numbers without prepending quotes', () => {
      expect(sanitizeCsvCell('Wedding Planner')).toBe('"Wedding Planner"');
      expect(sanitizeCsvCell(1500)).toBe('"1500"');
      expect(sanitizeCsvCell(null)).toBe('""');
      expect(sanitizeCsvCell(undefined)).toBe('""');
    });

    it('escapes internal quotes properly per RFC 4180', () => {
      expect(sanitizeCsvCell('John "The Host" Smith')).toBe('"John ""The Host"" Smith"');
    });

    it('generates fully escaped CSV table string', () => {
      const headers = ['Task', 'Cost', 'Notes'];
      const rows = [
        ['=cmd|calc', 100, 'Normal note'],
        ['Decor', 500, 'Contains "quotes"'],
      ];

      const csv = generateSafeCsv(headers, rows);
      expect(csv).toContain('"\'=cmd|calc"');
      expect(csv).toContain('"Contains ""quotes"""');
    });
  });

  describe('HTML Output Encoding', () => {
    it('replaces dangerous XSS characters with safe entities', () => {
      const malicious = '<script>alert("XSS")</script>&foo=\'bar\'';
      const encoded = encodeHtml(malicious);

      expect(encoded).not.toContain('<script>');
      expect(encoded).toContain('&lt;script&gt;');
      expect(encoded).toContain('&amp;foo=');
      expect(encoded).toContain('&quot;XSS&quot;');
      expect(encoded).toContain('&#039;bar&#039;');
    });
  });

  describe('URL Safety Verification', () => {
    it('accepts valid http and https URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
      expect(isSafeUrl('http://myvenue.org/contact')).toBe(true);
    });

    it('rejects javascript:, data:, and malformed URIs', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUrl('invalid-url-string')).toBe(false);
    });
  });
});
