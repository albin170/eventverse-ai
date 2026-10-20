import React, { useState } from 'react';
import { EventPlan } from '@/types';
import {
  downloadFile,
  generateBudgetCsv,
  generateExecutiveReport,
  generateTasksCsv,
  generateVendorsCsv,
  validateImportedPlan,
} from './engine';
import { DownloadIcon, CheckIcon, AlertCircleIcon } from '@/components/icons';

interface ExportViewProps {
  plan: EventPlan;
  onImportPlan: (imported: EventPlan) => void;
}

export const ExportView: React.FC<ExportViewProps> = ({ plan, onImportPlan }) => {
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const reportMarkdown = generateExecutiveReport(plan);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    const slug = plan.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    downloadFile(reportMarkdown, `${slug}-executive-dossier.md`, 'text/markdown;charset=utf-8;');
  };

  const handleExportBudgetCsv = () => {
    const csv = generateBudgetCsv(plan.budgetItems, plan.currency);
    downloadFile(csv, `${plan.id}-budget-ledger.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportTasksCsv = () => {
    const csv = generateTasksCsv(plan.tasks);
    downloadFile(csv, `${plan.id}-milestones-timeline.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportVendorsCsv = () => {
    const csv = generateVendorsCsv(plan.vendors);
    downloadFile(csv, `${plan.id}-supplier-directory.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportBackupJson = () => {
    const jsonStr = JSON.stringify(plan, null, 2);
    downloadFile(jsonStr, `${plan.id}-eventverse-backup.json`, 'application/json;charset=utf-8;');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateImportedPlan(content);
      if (res.success && res.plan) {
        onImportPlan(res.plan);
        setImportSuccess(true);
      } else {
        setImportError(res.error || 'Failed to parse JSON event plan.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Download Actions */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <DownloadIcon size={18} className="text-cyan-400" />
              <h3 className="text-xl font-bold font-display text-white">
                Export & Executive Dossier Delivery
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Produce sanitized, spreadsheet-injection safe CSV spreadsheets and comprehensive Markdown dossiers.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyReport}
              className="px-3.5 py-2 bg-midnight-900 hover:bg-midnight-800 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5"
            >
              {copied ? (
                <>
                  <CheckIcon size={14} className="text-emerald-400" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <span>Copy Markdown Report</span>
              )}
            </button>
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-glow transition-all flex items-center space-x-1.5"
            >
              <DownloadIcon size={14} />
              <span>Download Dossier</span>
            </button>
          </div>
        </div>

        {/* Download Format Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          {/* Budget CSV */}
          <div className="bg-midnight-900/70 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                Financial CSV
              </span>
              <h4 className="text-sm font-semibold text-white mt-1">Itemized Budget Ledger</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Sanitized CSV with formula injection defenses.
              </p>
            </div>
            <button
              onClick={handleExportBudgetCsv}
              className="mt-4 w-full py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-medium border border-white/10 transition-colors"
            >
              Export Budget CSV
            </button>
          </div>

          {/* Tasks CSV */}
          <div className="bg-midnight-900/70 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                Milestones CSV
              </span>
              <h4 className="text-sm font-semibold text-white mt-1">Timeline & Checklist</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Deadlines, responsible owners, and dependency trees.
              </p>
            </div>
            <button
              onClick={handleExportTasksCsv}
              className="mt-4 w-full py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-medium border border-white/10 transition-colors"
            >
              Export Tasks CSV
            </button>
          </div>

          {/* Vendors CSV */}
          <div className="bg-midnight-900/70 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Vendors CSV
              </span>
              <h4 className="text-sm font-semibold text-white mt-1">Supplier Directory</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Contacts, pricing tiers, quotes, and shortlist status.
              </p>
            </div>
            <button
              onClick={handleExportVendorsCsv}
              className="mt-4 w-full py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-medium border border-white/10 transition-colors"
            >
              Export Vendors CSV
            </button>
          </div>

          {/* Full Plan JSON Backup & Import */}
          <div className="bg-midnight-900/70 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Master Backup
              </span>
              <h4 className="text-sm font-semibold text-white mt-1">Full JSON State</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Export or restore entire plan configuration.
              </p>
            </div>
            <button
              onClick={handleExportBackupJson}
              className="mt-4 w-full py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-medium border border-white/10 transition-colors"
            >
              Export Backup JSON
            </button>
          </div>
        </div>
      </div>

      {/* JSON Import & Restore Section */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
        <h4 className="text-base font-bold text-white mb-1">Import & Restore Event Plan</h4>
        <p className="text-xs text-slate-400 mb-4">
          Upload a previously exported EventVerse AI JSON file. All imported data is strictly validated with Zod runtime schemas before being accepted.
        </p>

        <div className="flex items-center space-x-4">
          <label className="cursor-pointer px-4 py-2 bg-midnight-900 hover:bg-midnight-800 text-slate-200 border border-white/10 rounded-xl text-xs font-semibold transition-all">
            <span>Select JSON File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {importSuccess && (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
              <CheckIcon size={14} />
              <span>Event plan successfully restored and verified!</span>
            </div>
          )}

          {importError && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-400">
              <AlertCircleIcon size={14} />
              <span>{importError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Markdown Dossier Preview */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <h4 className="text-base font-semibold text-white">Live Dossier Preview</h4>
          <span className="text-xs text-slate-400">
            {reportMarkdown.split('\n').length} lines formatted
          </span>
        </div>

        <pre className="p-4 bg-midnight-950 rounded-xl border border-white/5 text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-[450px]">
          {reportMarkdown}
        </pre>
      </div>
    </div>
  );
};
