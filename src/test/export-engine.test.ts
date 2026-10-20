import { describe, it, expect } from 'vitest';
import {
  sanitizeCsvField,
  generateBudgetCsv,
  generateExecutiveReport,
  validateImportedPlan,
} from '@/features/export/engine';
import { BudgetItem } from '@/types';
import { createInitialDemoPlan } from '@/services/storage';

describe('Export Engine - Security & Sanitization', () => {
  describe('sanitizeCsvField (CSV Formula Injection Mitigation)', () => {
    it('escapes dangerous spreadsheet formula triggers: =, +, -, @', () => {
      expect(sanitizeCsvField('=cmd|"/C calc"!A0')).toBe(`"'=cmd|""/C calc""!A0"`);
      expect(sanitizeCsvField('+12345')).toBe(`"'+12345"`);
      expect(sanitizeCsvField('-SUM(A1:A10)')).toBe(`"'-SUM(A1:A10)"`);
      expect(sanitizeCsvField('@import')).toBe(`"'@import"`);
    });

    it('escapes double quotes properly', () => {
      expect(sanitizeCsvField('Wedding "Grand" Ball')).toBe(`"Wedding ""Grand"" Ball"`);
    });

    it('safely handles null and undefined', () => {
      expect(sanitizeCsvField(null)).toBe('""');
      expect(sanitizeCsvField(undefined)).toBe('""');
    });
  });

  describe('generateBudgetCsv', () => {
    it('generates valid CSV format with sanitized values', () => {
      const items: BudgetItem[] = [
        {
          id: 'item-1',
          name: '=SUM(1+1)',
          category: 'catering',
          estimatedCost: 1500,
          isPerPerson: false,
          priority: 'must_have',
          confirmed: false,
        },
      ];

      const csv = generateBudgetCsv(items, 'USD');
      expect(csv).toContain('Item ID,Item Name');
      // Must contain escaped formula prefix
      expect(csv).toContain(`"'=SUM(1+1)"`);
    });
  });

  describe('generateExecutiveReport', () => {
    it('produces structured Markdown report with all sections', () => {
      const plan = createInitialDemoPlan();
      const report = generateExecutiveReport(plan);

      expect(report).toContain('# Aura & Neil: Celestial Starlight Wedding');
      expect(report).toContain('## 1. Event Overview');
      expect(report).toContain('## 2. Creative Concept & Narrative');
      expect(report).toContain('## 3. Financial Summary & Budget Allocations');
      expect(report).toContain('## 4. Key Milestones & Timeline');
      expect(report).toContain('## 5. Vendor Shortlist & Bookings');
      expect(report).toContain('## 6. Risk Management & Cost Optimizations');
    });
  });

  describe('validateImportedPlan', () => {
    it('successfully validates a legitimate plan', () => {
      const validPlan = createInitialDemoPlan();
      const res = validateImportedPlan(JSON.stringify(validPlan));
      expect(res.success).toBe(true);
      expect(res.plan?.id).toBe(validPlan.id);
    });

    it('rejects malformed JSON', () => {
      const res = validateImportedPlan('{"incomplete": true,');
      expect(res.success).toBe(false);
      expect(res.error).toContain('Invalid JSON format');
    });

    it('rejects JSON missing required fields or invalid types', () => {
      const invalidPlan = {
        title: 'Missing essential fields',
        totalBudget: -500, // Invalid negative budget
      };
      const res = validateImportedPlan(JSON.stringify(invalidPlan));
      expect(res.success).toBe(false);
      expect(res.error).toContain('Validation error');
    });
  });
});
