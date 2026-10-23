import React from 'react';
import { Download, FolderSearch } from 'lucide-react';
import { APP_VERSION } from '../version.ts';
import { RadarFolderIcon } from './RadarFolderIcon.tsx';

interface HeaderProps {
  onScanClick: () => void;
  onExportClick: () => void;
  onLoadSample?: () => void;
  activeView: 'list' | 'tree';
  onViewChange: (view: 'list' | 'tree') => void;
  mediaCount: number;
  isScanning?: boolean;
  discoveredCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onScanClick,
  onExportClick,
  activeView,
  onViewChange,
  mediaCount,
  isScanning,
  discoveredCount
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 bg-slate-900 border-b border-slate-800 text-slate-100">
      {/* Zone 1: Brand wordmark & live scanning pill */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <RadarFolderIcon className="w-10 h-10" animated={isScanning} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                WinMedia Scanner
              </span>
              <span className="px-1.5 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[10px] rounded font-semibold tracking-wide">
                v{APP_VERSION}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Windows Media Cataloger & Inspector
            </span>
          </div>
        </div>

        {isScanning && (
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-blue-500/15 border border-blue-500/40 rounded-full text-xs font-mono text-cyan-300 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>Scanning: <strong className="text-white">{(discoveredCount ?? mediaCount).toLocaleString()}</strong> discovered</span>
          </div>
        )}
      </div>

      {/* Zone 2: Navigation Links / View Switcher */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onViewChange('list')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'list' ? 'text-blue-400 border-b-2 border-blue-500 pb-0.5' : ''
          }`}
        >
          Data Grid View
        </button>
        <button
          onClick={() => onViewChange('tree')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeView === 'tree' ? 'text-blue-400 border-b-2 border-blue-500 pb-0.5' : ''
          }`}
        >
          Folder Hierarchy
        </button>
      </nav>

      {/* Zone 3: Primary Action & Export */}
      <div className="flex items-center gap-3 shrink-0">

        <button
          onClick={onExportClick}
          disabled={mediaCount === 0}
          className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          title="Export media catalog to CSV"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={onScanClick}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm shadow-blue-900/40"
        >
          <FolderSearch className="w-4 h-4" />
          <span>Scan Folder</span>
        </button>
      </div>
    </header>
  );
};
