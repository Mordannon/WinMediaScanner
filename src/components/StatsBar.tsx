import React from 'react';
import { Film, Music, Image as ImageIcon, HardDrive, FolderTree } from 'lucide-react';
import { MediaItem } from '../types/media';
import { formatBytes } from '../utils/formatters';

interface StatsBarProps {
  items: MediaItem[];
  filteredItems: MediaItem[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ items, filteredItems }) => {
  if (items.length === 0) return null;

  const totalBytes = items.reduce((acc, curr) => acc + curr.size, 0);
  const filteredBytes = filteredItems.reduce((acc, curr) => acc + curr.size, 0);

  const videoCount = items.filter(i => i.type === 'video').length;
  const audioCount = items.filter(i => i.type === 'audio').length;
  const imageCount = items.filter(i => i.type === 'image').length;

  const uniqueFolders = new Set(items.map(i => i.folder)).size;

  const isFiltered = filteredItems.length !== items.length;

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3">
      <div className="w-full flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Metric summary */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Total Size:</span>
            <span className="font-mono font-semibold text-white tabular-nums">
              {formatBytes(totalBytes)}
            </span>
            {isFiltered && (
              <span className="text-slate-400 font-mono">
                (filtered: <span className="text-blue-400">{formatBytes(filteredBytes)}</span>)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Windows Folders:</span>
            <span className="font-mono font-semibold text-white tabular-nums">
              {uniqueFolders}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Video:</span>
              <span className="font-mono text-slate-200 tabular-nums">{videoCount}</span>
            </div>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audio:</span>
              <span className="font-mono text-slate-200 tabular-nums">{audioCount}</span>
            </div>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Images:</span>
              <span className="font-mono text-slate-200 tabular-nums">{imageCount}</span>
            </div>
          </div>
        </div>

        {/* Filter status indicator */}
        <div className="flex items-center gap-2">
          {isFiltered ? (
            <span className="text-amber-400 font-medium font-mono tabular-nums">
              Showing {filteredItems.length} of {items.length} media files
            </span>
          ) : (
            <span className="text-slate-400 font-mono tabular-nums">
              {items.length} media files cataloged
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
