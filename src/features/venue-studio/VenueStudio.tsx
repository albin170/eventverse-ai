import React, { useState } from 'react';
import { Venue3DConfig } from '@/types';
import { Venue3DCanvas } from './Venue3DCanvas';
import { Venue2DFallback } from './Venue2DFallback';

interface VenueStudioProps {
  config: Venue3DConfig;
  onChange: (updatedConfig: Venue3DConfig) => void;
  guestCount?: number;
}

export const VenueStudio: React.FC<VenueStudioProps> = ({ config, onChange, guestCount: _guestCount }) => {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [webglFailed, setWebglFailed] = useState(false);

  const handlePresetChange = (preset: Venue3DConfig['lightingPreset']) => {
    let themeColor = config.themeColor;
    let accentColor = config.accentColor;
    let ambient = 1.0;

    switch (preset) {
      case 'romantic':
        themeColor = '#E11D48'; // Rose
        accentColor = '#FB7185';
        ambient = 0.8;
        break;
      case 'vibrant':
        themeColor = '#8B5CF6'; // Violet
        accentColor = '#06B6D4'; // Cyan
        ambient = 1.3;
        break;
      case 'evening':
        themeColor = '#6366F1'; // Indigo
        accentColor = '#38BDF8';
        ambient = 1.0;
        break;
      case 'minimal':
        themeColor = '#94A3B8'; // Slate
        accentColor = '#F8FAFC';
        ambient = 1.1;
        break;
    }

    onChange({
      ...config,
      lightingPreset: preset,
      themeColor,
      accentColor,
      ambientBrightness: ambient,
    });
  };

  const handleReset = () => {
    onChange({
      themeColor: '#8B5CF6',
      accentColor: '#06B6D4',
      lightingPreset: 'evening',
      stagePosition: 'front',
      tableLayout: 'banquet',
      tableCount: 12,
      danceFloor: true,
      ambientBrightness: 1.0,
    });
  };

  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-card">
      {/* Header and Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <h3 className="text-xl font-bold font-display text-white">
              Interactive Venue Spatial Studio
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time procedural layout configuration with dynamic lighting and table arrangement.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-midnight-900 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            disabled={webglFailed}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              viewMode === '3d' && !webglFailed
                ? 'bg-violet-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
            aria-pressed={viewMode === '3d'}
          >
            3D Spatial View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              viewMode === '2d' || webglFailed
                ? 'bg-violet-600 text-white shadow-glow'
                : 'text-slate-400 hover:text-white'
            }`}
            aria-pressed={viewMode === '2d'}
          >
            2D Floor Plan
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="my-6">
        {viewMode === '3d' && !webglFailed ? (
          <Venue3DCanvas
            config={config}
            onConfigChange={onChange}
            onError={() => {
              setWebglFailed(true);
              setViewMode('2d');
            }}
          />
        ) : (
          <Venue2DFallback config={config} onConfigChange={onChange} />
        )}
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-sm">
        {/* Table Count */}
        <div>
          <label
            htmlFor="table-count-slider"
            className="block text-xs font-semibold text-slate-300 mb-1.5"
          >
            Table Count ({config.tableCount})
          </label>
          <input
            id="table-count-slider"
            type="range"
            min={2}
            max={30}
            value={config.tableCount}
            onChange={(e) =>
              onChange({ ...config, tableCount: parseInt(e.target.value, 10) })
            }
            className="w-full accent-violet-500 bg-midnight-900 rounded-lg cursor-pointer"
          />
        </div>

        {/* Table Layout */}
        <div>
          <label
            htmlFor="table-layout-select"
            className="block text-xs font-semibold text-slate-300 mb-1.5"
          >
            Layout Style
          </label>
          <select
            id="table-layout-select"
            value={config.tableLayout}
            onChange={(e) =>
              onChange({
                ...config,
                tableLayout: e.target.value as Venue3DConfig['tableLayout'],
              })
            }
            className="w-full bg-midnight-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="banquet">Round Banquet (6-8 Seats)</option>
            <option value="cocktail">Cocktail High-Tops</option>
            <option value="theater">Theater Auditory</option>
            <option value="u_shape">U-Shape Executive</option>
          </select>
        </div>

        {/* Stage Position */}
        <div>
          <label
            htmlFor="stage-position-select"
            className="block text-xs font-semibold text-slate-300 mb-1.5"
          >
            Stage Position
          </label>
          <select
            id="stage-position-select"
            value={config.stagePosition}
            onChange={(e) =>
              onChange({
                ...config,
                stagePosition: e.target.value as Venue3DConfig['stagePosition'],
              })
            }
            className="w-full bg-midnight-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="front">Front Stage</option>
            <option value="center">Center Arena Stage</option>
            <option value="none">No Elevated Stage</option>
          </select>
        </div>

        {/* Lighting Atmosphere Preset */}
        <div>
          <label
            htmlFor="lighting-preset-select"
            className="block text-xs font-semibold text-slate-300 mb-1.5"
          >
            Atmosphere Preset
          </label>
          <select
            id="lighting-preset-select"
            value={config.lightingPreset}
            onChange={(e) =>
              handlePresetChange(e.target.value as Venue3DConfig['lightingPreset'])
            }
            className="w-full bg-midnight-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="evening">Celestial Evening (Indigo/Cyan)</option>
            <option value="romantic">Rose Sunset (Ruby/Blush)</option>
            <option value="vibrant">Cyber Neon (Violet/Cyan)</option>
            <option value="minimal">Architectural Minimal (Silver/White)</option>
          </select>
        </div>
      </div>

      {/* Auxiliary Toggles & Actions */}
      <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-white/5 gap-3">
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={config.danceFloor}
              onChange={(e) => onChange({ ...config, danceFloor: e.target.checked })}
              className="rounded bg-midnight-900 border-white/20 text-violet-600 focus:ring-violet-500"
            />
            <span>Include Dance Floor Area</span>
          </label>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400">Theme Color:</span>
            <input
              type="color"
              value={config.themeColor}
              onChange={(e) => onChange({ ...config, themeColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              title="Change theme accent"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition-colors"
        >
          Reset to Default Layout
        </button>
      </div>
    </div>
  );
};
