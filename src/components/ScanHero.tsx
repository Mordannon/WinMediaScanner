import React, { useState } from 'react';
import { FolderSearch, StopCircle, Settings2, Check } from 'lucide-react';
import { ScanProgress } from '../types/media';
import { formatBytes } from '../utils/formatters';

interface ScanHeroProps {
  onSelectFolder?: () => void;
  onLoadSample?: () => void;
  scanProgress: ScanProgress;
  onCancelScan: () => void;
  windowsPrefix: string;
  onUpdateWindowsPrefix: (prefix: string) => void;
  mediaCount: number;
}

export const ScanHero: React.FC<ScanHeroProps> = ({
  scanProgress,
  onCancelScan,
  windowsPrefix,
  onUpdateWindowsPrefix,
  mediaCount
}) => {
  const [isEditingPrefix, setIsEditingPrefix] = useState(false);
  const [prefixInput, setPrefixInput] = useState(windowsPrefix);

  const savePrefix = () => {
    onUpdateWindowsPrefix(prefixInput.trim());
    setIsEditingPrefix(false);
  };

  return (
    <div className="w-full bg-slate-900/80 border-b border-slate-800 px-4 sm:px-6 py-4">
      <div className="w-full">
        {/* Scanning active progress state */}
        {scanProgress.isScanning ? (
          <div className="bg-slate-800/95 border border-blue-500/50 rounded-xl p-4 mb-3 shadow-xl backdrop-blur-md ring-1 ring-blue-500/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-700/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <FolderSearch className="w-5 h-5 animate-spin" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-sm font-semibold text-white tracking-wide">
                      Recursively Scanning Windows Directory...
                    </h3>
                    {scanProgress.percent !== undefined && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                        {scanProgress.percent}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-mono truncate max-w-2xl mt-0.5" title={scanProgress.currentFolder}>
                    {scanProgress.currentFolder || 'Traversing directory tree...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-base font-extrabold text-blue-400 font-mono tabular-nums flex items-center justify-end gap-1.5">
                    <span className="text-white text-lg">{scanProgress.mediaFilesCount}</span>
                    <span className="text-blue-300 text-xs font-normal uppercase tracking-wider">media found</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {scanProgress.scannedFilesCount.toLocaleString()} total files · {formatBytes(scanProgress.totalBytes)} · {Math.max(1, Math.round(scanProgress.elapsedMs / 1000))}s
                  </div>
                </div>

                <button
                  onClick={onCancelScan}
                  className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                  title="Stop scan immediately"
                >
                  <StopCircle className="w-4 h-4 text-rose-400" />
                  <span>Stop Scan</span>
                </button>
              </div>
            </div>

            {/* Dynamic Scanning progress bar */}
            <div className="relative w-full h-2 bg-slate-900/90 rounded-full mt-3 overflow-hidden border border-slate-700/60 shadow-inner">
              {scanProgress.percent !== undefined ? (
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                  style={{ width: `${Math.max(3, scanProgress.percent)}%` }}
                />
              ) : (
                <div className="animate-indeterminate-beam bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-500 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
              )}
            </div>
          </div>
        ) : null}

        {/* Scan Header & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>Recursive Windows Media Scanner</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any local Windows directory to recursively catalog movies, TV shows, music, and photos with codec inspection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Windows Root Path Configuration */}
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
              <span className="text-slate-400 font-mono">Windows Drive/Path:</span>
              {isEditingPrefix ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={prefixInput}
                    onChange={(e) => setPrefixInput(e.target.value)}
                    placeholder="e.g. D:\Media or C:\Users\Videos"
                    className="px-2 py-0.5 bg-slate-900 border border-slate-600 rounded text-xs text-white font-mono focus:outline-none focus:border-blue-500 w-48"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') savePrefix();
                      if (e.key === 'Escape') setIsEditingPrefix(false);
                    }}
                  />
                  <button
                    onClick={savePrefix}
                    className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-slate-700 rounded"
                    title="Save prefix"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-300">{windowsPrefix || 'Auto-detect drive'}</span>
                  <button
                    onClick={() => {
                      setPrefixInput(windowsPrefix);
                      setIsEditingPrefix(true);
                    }}
                    className="text-slate-400 hover:text-white p-0.5"
                    title="Configure Windows path prefix"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
