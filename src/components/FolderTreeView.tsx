import React, { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Copy, Check, Film, Music, Image as ImageIcon, FileQuestion } from 'lucide-react';
import { MediaItem, MediaType } from '../types';
import { formatBytes } from '../utils';

interface FolderTreeViewProps {
  items: MediaItem[];
  onInspectItem: (item: MediaItem) => void;
  onFilterByFolder: (folder: string) => void;
  onOpenFolder?: (folder: string) => void;
}

export const FolderTreeView: React.FC<FolderTreeViewProps> = ({
  items,
  onInspectItem,
  onFilterByFolder,
  onOpenFolder
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [openedFolder, setOpenedFolder] = useState<string | null>(null);

  // Group items by folder
  const folderGroups = React.useMemo(() => {
    const map = new Map<string, { folder: string; files: MediaItem[]; totalBytes: number }>();
    for (const item of items) {
      if (!map.has(item.folder)) {
        map.set(item.folder, { folder: item.folder, files: [], totalBytes: 0 });
      }
      const entry = map.get(item.folder)!;
      entry.files.push(item);
      entry.totalBytes += item.size;
    }
    return Array.from(map.values()).sort((a, b) => a.folder.localeCompare(b.folder));
  }, [items]);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedFolders(new Set(folderGroups.map(g => g.folder)));
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  const handleOpenFolder = async (folder: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenFolder) {
      onOpenFolder(folder);
    } else if (typeof window !== 'undefined' && window.electronAPI?.openFolder) {
      try {
        await window.electronAPI.openFolder(folder);
      } catch (err) {
        console.error('Failed to open folder:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(folder);
      } catch {}
    }
    setOpenedFolder(folder);
    setTimeout(() => setOpenedFolder(null), 2000);
  };

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'video':
        return <Film className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <FileQuestion className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No media folders to display.
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 p-4 sm:p-6">
      <div className="w-full space-y-4">
        {/* Hierarchy controls */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
          <div className="font-mono">
            {folderGroups.length} Windows directories containing media
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Folder items */}
        <div className="space-y-2">
          {folderGroups.map((group) => {
            const isExpanded = expandedFolders.has(group.folder);
            const isOpened = openedFolder === group.folder;

            return (
              <div
                key={group.folder}
                className="border border-slate-800 bg-slate-800/40 rounded-lg overflow-hidden transition-colors"
              >
                {/* Folder Header Row */}
                <div
                  onClick={() => toggleFolder(group.folder)}
                  className="px-4 py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/80 transition-colors select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button className="text-slate-400 hover:text-white">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded ? (
                      <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 text-amber-500/80 shrink-0" />
                    )}

                    <span className="font-mono text-xs font-semibold text-white truncate" title={group.folder}>
                      {group.folder}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    <span className="font-mono text-slate-400 tabular-nums">
                      {group.files.length} {group.files.length === 1 ? 'file' : 'files'}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="font-mono font-medium text-slate-300 tabular-nums">
                      {formatBytes(group.totalBytes)}
                    </span>

                    <button
                      onClick={(e) => handleOpenFolder(group.folder, e)}
                      className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                      title="Open folder"
                    >
                      {isOpened ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <FolderOpen className="w-3.5 h-3.5 text-amber-400/80 hover:text-amber-400" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterByFolder(group.folder);
                      }}
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      Filter grid
                    </button>
                  </div>
                </div>

                {/* Sub-file list */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-900/60 divide-y divide-slate-800/50">
                    {group.files.map((file) => (
                      <div
                        key={file.id}
                        onClick={() => onInspectItem(file)}
                        className="px-6 py-2 flex items-center justify-between gap-4 hover:bg-slate-800/40 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {getMediaIcon(file.type)}
                          <span className="font-mono text-slate-200 truncate" title={file.name}>
                            {file.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-5 shrink-0 font-mono text-[11px]">
                          <span className="text-blue-300">{file.codec}</span>
                          <span className="text-slate-400 uppercase">.{file.extension}</span>
                          <span className="tabular-nums text-slate-200 w-20 text-right">
                            {file.sizeFormatted}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
