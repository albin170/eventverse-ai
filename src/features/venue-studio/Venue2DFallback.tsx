import React from 'react';
import { Venue3DConfig } from '@/types';

interface Venue2DFallbackProps {
  config: Venue3DConfig;
  onConfigChange?: (newConfig: Venue3DConfig) => void;
}

export const Venue2DFallback: React.FC<Venue2DFallbackProps> = ({ config }) => {
  const tableCount = Math.min(30, config.tableCount);
  const cols = Math.ceil(Math.sqrt(tableCount * 1.5));
  // Generate 2D table coordinates
  const tables = [];
  for (let i = 0; i < tableCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 80 + col * 75;
    const y = 180 + row * 65;
    tables.push({ id: i + 1, x, y });
  }

  return (
    <div
      className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-surface-border bg-midnight-950 p-4 flex flex-col"
      role="region"
      aria-label="2D Architectural Venue Floor Plan View"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-400"></span>
          <h4 className="text-sm font-semibold text-white">2D Architectural Floor Plan</h4>
          <span className="text-xs bg-violet-950/70 border border-violet-800 text-violet-300 px-2 py-0.5 rounded-full">
            Accessible 2D Mode
          </span>
        </div>
        <div className="text-xs text-slate-400">
          Showing {tableCount} Tables ({config.tableLayout}) • Stage: {config.stagePosition}
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="flex-1 w-full relative bg-midnight-900/60 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 600 400"
          className="w-full h-full max-h-[380px]"
          aria-hidden="true"
        >
          <defs>
            <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f253e" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="stageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2b3456" />
              <stop offset="100%" stopColor="#1a1e35" />
            </linearGradient>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={config.themeColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={config.themeColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Grid background */}
          <rect width="600" height="400" fill="url(#gridPattern)" />

          {/* Stage Element */}
          {config.stagePosition !== 'none' && (
            <g
              transform={
                config.stagePosition === 'center'
                  ? 'translate(200, 150)'
                  : 'translate(180, 25)'
              }
            >
              <rect
                width="240"
                height="60"
                rx="6"
                fill="url(#stageGrad)"
                stroke={config.themeColor}
                strokeWidth="2"
              />
              <text
                x="120"
                y="35"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="600"
                letterSpacing="1"
              >
                MAIN STAGE & AUDIO
              </text>
            </g>
          )}

          {/* Dance Floor */}
          {config.danceFloor && (
            <g transform="translate(230, 110)">
              <rect
                width="140"
                height="50"
                rx="4"
                fill="#161a2d"
                stroke={config.accentColor}
                strokeDasharray="4 2"
                strokeWidth="1.5"
              />
              <text
                x="70"
                y="30"
                textAnchor="middle"
                fill="#22d3ee"
                fontSize="10"
                fontWeight="500"
              >
                DANCE FLOOR
              </text>
            </g>
          )}

          {/* Tables with guest seats */}
          {tables.map((t) => (
            <g key={t.id} transform={`translate(${t.x}, ${t.y})`}>
              {/* Outer chair ring */}
              <circle cx="20" cy="20" r="22" fill="none" stroke="#2b3456" strokeDasharray="3 3" />
              {/* Table circle */}
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="#1b2038"
                stroke="#374169"
                strokeWidth="1.5"
              />
              {/* Centerpiece glow */}
              <circle cx="20" cy="20" r="6" fill={config.themeColor} opacity="0.9" />
              {/* Table number */}
              <text
                x="20"
                y="23"
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="8"
                fontWeight="bold"
              >
                T{t.id}
              </text>
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-midnight-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-white/10 flex items-center space-x-3 text-[11px] text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.themeColor }}></span>
            <span>Table Centerpiece</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded border border-cyan-400"></span>
            <span>Dance Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
};
