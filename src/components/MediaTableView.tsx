import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ArrowUpDown, ArrowUp, ArrowDown, Check, Info, Film, 
  Music, Image as ImageIcon, FileQuestion, FolderOpen, FolderSearch,
  RotateCcw, WrapText, Maximize2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
  Columns3, ChevronDown, Trash2, Play, FolderX
} from 'lucide-react';
import { MediaItem, SortColumn, SortDirection, MediaType } from '../types/media.ts';
import { DeleteConfirmationModal } from './DeleteConfirmationModal.tsx';
import { RadarFolderIcon } from './RadarFolderIcon.tsx';

export type ColumnKey = 'name' | 'folder' | 'codec' | 'resolution' | 'extension' | 'size';

export interface ColumnDefinition {
  key: ColumnKey;
  label: string;
}

export const AVAILABLE_COLUMNS: ColumnDefinition[] = [
  { key: 'name', label: 'File Name' },
  { key: 'folder', label: 'Folder Path' },
  { key: 'codec', label: 'Codec' },
  { key: 'resolution', label: 'Resolution' },
  { key: 'extension', label: 'Extension' },
  { key: 'size', label: 'Size' }
];

const DEFAULT_VISIBLE_COLUMNS: Record<ColumnKey, boolean> = {
  name: true,
  folder: true,
  codec: true,
  resolution: true,
  extension: true,
  size: true
};

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  select: 44,
  name: 340,
  folder: 380,
  codec: 180,
  resolution: 130,
  extension: 100,
  size: 110,
  actions: 90
};

interface MediaTableViewProps {
  items: MediaItem[];
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onInspectItem: (item: MediaItem) => void;
  onFilterByFolder: (folder: string) => void;
  onExcludeFolder?: (folder: string) => void;
  excludedFolders?: string[];
  onFilterByCodec: (codec: string) => void;
  onFilterByResolution?: (resolution: string) => void;
  onFilterByExtension: (ext: string) => void;
  onScanFolder?: () => void;
  onOpenFolder?: (folder: string) => void;
  onOpenFile?: (filePath: string) => void;
  onDeleteItems?: (itemsToDelete: MediaItem[]) => void;
  onLoadSample?: () => void;
  isScanning?: boolean;
  scannedCount?: number;
}

export const MediaTableView: React.FC<MediaTableViewProps> = ({
  items,
  sortColumn,
  sortDirection,
  onSort,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onInspectItem,
  onFilterByFolder,
  onExcludeFolder,
  excludedFolders,
  onFilterByCodec,
  onFilterByResolution,
  onFilterByExtension,
  onScanFolder,
  onOpenFolder,
  onOpenFile,
  onDeleteItems,
  isScanning,
  scannedCount
}) => {
  const [openedFolderId, setOpenedFolderId] = useState<string | null>(null);
  const [deleteConfirmationItems, setDeleteConfirmationItems] = useState<MediaItem[] | null>(null);
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
  const [wrapText, setWrapText] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const columnPickerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Column visibility state with localStorage persistence
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    try {
      const saved = localStorage.getItem('winmedia_visible_columns');
      if (saved) return { ...DEFAULT_VISIBLE_COLUMNS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_VISIBLE_COLUMNS;
  });

  // Column widths with persistent localStorage support
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('winmedia_column_widths');
      if (saved) return { ...DEFAULT_COLUMN_WIDTHS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_COLUMN_WIDTHS;
  });

  // Close column picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setIsColumnPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumnVisibility = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[key] && activeCount <= 1) {
        return prev; // keep at least 1 column visible
      }
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('winmedia_visible_columns', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const showAllColumns = () => {
    const next = { ...DEFAULT_VISIBLE_COLUMNS };
    setVisibleColumns(next);
    try {
      localStorage.setItem('winmedia_visible_columns', JSON.stringify(next));
    } catch {}
  };

  // Track window resizing and container width in real time
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      }
    });

    observer.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Calculate sum of visible column widths
  const baseTotalWidth = useMemo(() => {
    let sum = (columnWidths.select || 44) + (columnWidths.actions || 70);
    AVAILABLE_COLUMNS.forEach(col => {
      if (visibleColumns[col.key]) {
        sum += (columnWidths[col.key] || DEFAULT_COLUMN_WIDTHS[col.key] || 100);
      }
    });
    return sum;
  }, [columnWidths, visibleColumns]);

  // Dynamically auto-expand visible column widths to fill 100% of window width
  const effectiveWidths = useMemo(() => {
    const widths: Record<string, number> = { ...columnWidths };
    if (!containerWidth || containerWidth <= baseTotalWidth) {
      return widths;
    }
    const extraSpace = containerWidth - baseTotalWidth;

    const canExpandFolder = visibleColumns.folder;
    const canExpandName = visibleColumns.name;

    if (canExpandFolder && canExpandName) {
      const extraFolder = Math.round(extraSpace * 0.6);
      const extraName = extraSpace - extraFolder;
      widths.folder = (widths.folder || DEFAULT_COLUMN_WIDTHS.folder) + extraFolder;
      widths.name = (widths.name || DEFAULT_COLUMN_WIDTHS.name) + extraName;
    } else if (canExpandFolder) {
      widths.folder = (widths.folder || DEFAULT_COLUMN_WIDTHS.folder) + extraSpace;
    } else if (canExpandName) {
      widths.name = (widths.name || DEFAULT_COLUMN_WIDTHS.name) + extraSpace;
    } else {
      const visibleKeys = AVAILABLE_COLUMNS.filter(c => visibleColumns[c.key]).map(c => c.key);
      if (visibleKeys.length > 0) {
        const perCol = Math.floor(extraSpace / visibleKeys.length);
        visibleKeys.forEach(k => {
          widths[k] = (widths[k] || DEFAULT_COLUMN_WIDTHS[k]) + perCol;
        });
      }
    }

    return widths;
  }, [columnWidths, containerWidth, baseTotalWidth, visibleColumns]);

  const effectiveTableWidth = containerWidth > baseTotalWidth ? containerWidth : baseTotalWidth;

  const resizingRef = useRef<{ column: string; startX: number; startWidth: number } | null>(null);

  const startResizing = (column: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      column,
      startX: e.clientX,
      startWidth: effectiveWidths[column] || 150
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const deltaX = moveEvent.clientX - resizingRef.current.startX;
      const minWidth = resizingRef.current.column === 'select' ? 36 : 60;
      const newWidth = Math.max(minWidth, resizingRef.current.startWidth + deltaX);
      setColumnWidths(prev => {
        const next = { ...prev, [resizingRef.current!.column]: newWidth };
        try {
          localStorage.setItem('winmedia_column_widths', JSON.stringify(next));
        } catch {}
        return next;
      });
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const resetColumns = () => {
    setColumnWidths(DEFAULT_COLUMN_WIDTHS);
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    try {
      localStorage.removeItem('winmedia_column_widths');
      localStorage.removeItem('winmedia_visible_columns');
    } catch {}
  };

  const totalPages = Math.ceil(items.length / pageSize) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  // Dynamic sliding page numbers
  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
  }, [currentPage, totalPages]);

  const handleOpenFolder = async (folderPath: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenFolder) {
      onOpenFolder(folderPath);
    } else if (typeof window !== 'undefined' && window.electronAPI?.openFolder) {
      try {
        await window.electronAPI.openFolder(folderPath);
      } catch (err) {
        console.error('Failed to open folder natively:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(folderPath);
      } catch {}
    }
    setOpenedFolderId(id);
    setTimeout(() => setOpenedFolderId(null), 2000);
  };

  const handleOpenFile = async (filePath: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onOpenFile) {
      onOpenFile(filePath);
    } else if (typeof window !== 'undefined' && window.electronAPI?.openFile) {
      try {
        await window.electronAPI.openFile(filePath);
      } catch (err) {
        console.error('Failed to open file natively:', err);
      }
    }
  };

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'video':
        return <Film className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'audio':
        return <Music className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <FileQuestion className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
    );
  };

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length;

  if (items.length === 0) {
    if (isScanning) {
      return (
        <div className="w-full bg-slate-900 px-6 py-20 text-center text-slate-400">
          <RadarFolderIcon className="w-16 h-16 mx-auto mb-4" animated={true} />
          <h3 className="text-base font-bold text-white mb-1.5 flex items-center justify-center gap-2">
            <span>Recursively Indexing Media Files...</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 font-mono">
            Scanning Windows subfolders. Discovered files ({scannedCount || 0}) will populate this data grid live.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Active Discovery in Progress</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full bg-slate-900 px-6 py-16 text-center text-slate-400">
        <RadarFolderIcon className="w-16 h-16 mx-auto mb-4 opacity-90 hover:opacity-100 transition-opacity" />
        <h3 className="text-base font-semibold text-slate-200 mb-1">
          No media files to display
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-5">
          Select a Windows folder to recursively scan all subfolders for video, audio, and photo files, or drop a directory into this window.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onScanFolder && (
            <button
              onClick={onScanFolder}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-blue-900/40"
            >
              <FolderSearch className="w-4 h-4" />
              <span>Scan Windows Folder</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900">
      {/* Table Toolbar: Column visibility, Density, Word Wrap, Column Reset, and Page size */}
      <div className="px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            {selectedIds.size > 0 ? (
              <span className="text-blue-400 font-semibold font-mono">
                {selectedIds.size} of {items.length} selected
              </span>
            ) : (
              <span className="font-mono">
                Showing {startIndex + 1}–{Math.min(startIndex + pageSize, items.length)} of {items.length} files
              </span>
            )}
          </span>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={onClearSelection}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Clear selection
              </button>
              <button
                onClick={() => {
                  const selectedItemsList = items.filter(i => selectedIds.has(i.id));
                  setDeleteConfirmationItems(selectedItemsList);
                }}
                className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-rose-100 font-semibold rounded text-[11px] transition-colors flex items-center gap-1.5 shadow-xs"
                title="Delete all selected files from filesystem"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Full Width Dynamic Badge */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            <Maximize2 className="w-3 h-3" />
            <span>Full Width Responsive</span>
          </div>

          {/* Column Visibility Dropdown */}
          <div className="relative" ref={columnPickerRef}>
            <button
              onClick={() => setIsColumnPickerOpen(prev => !prev)}
              className={`px-2 py-1 rounded border text-[11px] transition-colors flex items-center gap-1.5 ${
                isColumnPickerOpen
                  ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700/60 text-slate-300 hover:text-white'
              }`}
              title="Turn table columns off or on"
            >
              <Columns3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Columns ({visibleColumnCount}/{AVAILABLE_COLUMNS.length})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isColumnPickerOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2.5 z-40 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-200">Table Columns</span>
                  <button
                    onClick={showAllColumns}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Show All
                  </button>
                </div>
                <div className="space-y-1">
                  {AVAILABLE_COLUMNS.map(col => {
                    const isChecked = visibleColumns[col.key];
                    return (
                      <label
                        key={col.key}
                        className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800/80 cursor-pointer text-slate-300 hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumnVisibility(col.key)}
                            className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-[12px]">{col.label}</span>
                        </div>
                        {isChecked && <Check className="w-3 h-3 text-emerald-400" />}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Reset Columns Button */}
          <button
            onClick={resetColumns}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700/60 transition-colors flex items-center gap-1 text-[11px]"
            title="Reset column widths and visibility to defaults"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Reset Columns</span>
          </button>

          {/* Text Wrap Toggle */}
          <button
            onClick={() => setWrapText(!wrapText)}
            className={`px-2 py-1 rounded border text-[11px] transition-colors flex items-center gap-1 ${
              wrapText
                ? 'bg-blue-600/30 border-blue-500/60 text-blue-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            title="Toggle word wrapping for long file names and Windows paths"
          >
            <WrapText className="w-3 h-3" />
            <span>{wrapText ? 'Wrapping On' : 'Wrap Paths'}</span>
          </button>

          {/* Density toggle */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded border border-slate-700/60">
            <button
              onClick={() => setDensity('compact')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                density === 'compact' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                density === 'comfortable' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Comfortable
            </button>
          </div>

          {/* Page size */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={items.length}>All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main High-Density Auto-Expanding Resizable Table */}
      <div ref={containerRef} className="overflow-x-auto w-full">
        <table 
          className="table-fixed text-left border-collapse text-xs w-full"
          style={{ width: `${effectiveTableWidth}px`, minWidth: '100%' }}
        >
          <thead>
            <tr className="bg-slate-800/60 border-b border-slate-700 text-slate-300 select-none">
              {/* Checkbox Column */}
              <th 
                style={{ width: `${effectiveWidths.select}px` }} 
                className="py-2.5 px-3 text-center relative"
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={isAllSelected ? onClearSelection : onSelectAll}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  title="Select all"
                />
              </th>
              
              {/* File Name Column */}
              {visibleColumns.name && (
                <th 
                  style={{ width: `${effectiveWidths.name}px` }}
                  className="py-2.5 px-3 font-semibold hover:text-white cursor-pointer group whitespace-nowrap relative"
                >
                  <div onClick={() => onSort('name')} className="flex items-center gap-1.5 pr-2">
                    <span>File Name</span>
                    {renderSortIndicator('name')}
                  </div>
                  {/* Resize Handle */}
                  <div
                    onMouseDown={(e) => startResizing('name', e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/60 active:bg-blue-500 group-hover:bg-slate-600/40 transition-colors"
                    title="Drag to resize File Name column"
                  />
                </th>
              )}

              {/* Windows Folder Column */}
              {visibleColumns.folder && (
                <th 
                  style={{ width: `${effectiveWidths.folder}px` }}
                  className="py-2.5 px-3 font-semibold hover:text-white cursor-pointer group whitespace-nowrap relative"
                >
                  <div onClick={() => onSort('folder')} className="flex items-center gap-1.5 pr-2">
                    <span>Folder Path</span>
                    {renderSortIndicator('folder')}
                  </div>
                  {/* Resize Handle */}
                  <div
                    onMouseDown={(e) => startResizing('folder', e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/60 active:bg-blue-500 group-hover:bg-slate-600/40 transition-colors"
                    title="Drag to resize Folder column"
                  />
                </th>
              )}

              {/* Codec Column */}
              {visibleColumns.codec && (
                <th 
                  style={{ width: `${effectiveWidths.codec}px` }}
                  className="py-2.5 px-3 font-semibold hover:text-white cursor-pointer group whitespace-nowrap relative"
                >
                  <div onClick={() => onSort('codec')} className="flex items-center gap-1.5 pr-2">
                    <span>Codec</span>
                    {renderSortIndicator('codec')}
                  </div>
                  {/* Resize Handle */}
                  <div
                    onMouseDown={(e) => startResizing('codec', e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/60 active:bg-blue-500 group-hover:bg-slate-600/40 transition-colors"
                    title="Drag to resize Codec column"
                  />
                </th>
              )}

              {/* Resolution Column */}
              {visibleColumns.resolution && (
                <th 
                  style={{ width: `${effectiveWidths.resolution}px` }}
                  className="py-2.5 px-3 font-semibold hover:text-white cursor-pointer group whitespace-nowrap relative"
                >
                  <div onClick={() => onSort('resolution')} className="flex items-center gap-1.5 pr-2">
                    <span>Resolution</span>
                    {renderSortIndicator('resolution')}
                  </div>
                  {/* Resize Handle */}
                  <div
                    onMouseDown={(e) => startResizing('resolution', e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/60 active:bg-blue-500 group-hover:bg-slate-600/40 transition-colors"
                    title="Drag to resize Resolution column"
                  />
                </th>
              )}

              {/* Extension Column */}
              {visibleColumns.extension && (
                <th 
                  style={{ width: `${effectiveWidths.extension}px` }}
                  className="py-2.5 px-3 font-semibold hover:text-white cursor-pointer group whitespace-nowrap relative"
                >
                  <div onClick={() => onSort('extension')} className="flex items-center gap-1.5 pr-2">
                    <span>Extension</span>
                    {renderSortIndicator('extension')}
                  </div>
                  {/* Resize Handle */}
                  <div
                    onMouseDown={(e) => startResizing('extension', e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/60 active:bg-blue-500 group-hover:bg-slate-600/40 transition-colors"
                    title="Drag to resize Extension column"
                  />
                </th>
              )}

              {/* Size Column */}
              {visibleColumns.size && (
                <th 
                  style={{ width: `${effectiveWidths.size}px` }}
                  className="py-2.5 px-3 font-semibold hover:text-white cursor-pointer group whitespace-nowrap text-right relative"
                >
                  <div onClick={() => onSort('size')} className="flex items-center justify-end gap-1.5 pr-2">
                    <span>Size</span>
                    {renderSortIndicator('size')}
                  </div>
                  {/* Resize Handle */}
                  <div
                    onMouseDown={(e) => startResizing('size', e)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500/60 active:bg-blue-500 group-hover:bg-slate-600/40 transition-colors"
                    title="Drag to resize Size column"
                  />
                </th>
              )}

              {/* Quick Actions Column */}
              <th 
                style={{ width: `${effectiveWidths.actions}px` }} 
                className="py-2.5 px-3 text-center text-slate-500 font-normal relative"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {paginatedItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const rowPadding = density === 'compact' ? 'py-1.5' : 'py-3';
              const textCls = wrapText ? 'break-all' : 'truncate';

              return (
                <tr
                  key={item.id}
                  onClick={() => onInspectItem(item)}
                  className={`group transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/30 hover:bg-blue-900/40'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td 
                    className={`${rowPadding} px-3 text-center cursor-pointer`} 
                    style={{ width: `${effectiveWidths.select}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(item.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(item.id);
                      }}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* File Name */}
                  {visibleColumns.name && (
                    <td 
                      style={{ width: `${effectiveWidths.name}px` }}
                      className={`${rowPadding} px-3 text-slate-200 font-medium overflow-hidden`}
                    >
                      <div className="flex items-center justify-between gap-1.5 group/filename">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {getMediaIcon(item.type)}
                          <span 
                            className={`font-mono text-[13px] text-slate-100 group-hover:text-blue-300 transition-colors ${textCls}`} 
                            title={item.name}
                          >
                            {item.name}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleOpenFile(item.fullPath, e)}
                          className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded transition-colors opacity-0 group-hover:opacity-100 group-hover/filename:opacity-100 flex-shrink-0"
                          title={`Open ${item.name} in default application`}
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                        </button>
                      </div>
                    </td>
                  )}

                  {/* Windows Folder */}
                  {visibleColumns.folder && (
                    <td 
                      style={{ width: `${effectiveWidths.folder}px` }}
                      className={`${rowPadding} px-3 text-slate-400 font-mono text-[12px] overflow-hidden`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            onFilterByFolder(item.folder);
                          }}
                          className={`hover:text-blue-300 hover:underline cursor-pointer ${textCls}`} 
                          title={`Filter by this folder: ${item.folder}`}
                        >
                          {item.folder}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onExcludeFolder?.(item.folder);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded transition-all shrink-0"
                            title={`Exclude "${item.folder}" and its subfolders from results`}
                          >
                            <FolderX className="w-3.5 h-3.5 text-rose-400/80 hover:text-rose-400" />
                          </button>
                          <button
                            onClick={(e) => handleOpenFolder(item.folder, item.id, e)}
                            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-all shrink-0"
                            title="Open folder in File Explorer"
                          >
                            {openedFolderId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <FolderOpen className="w-3.5 h-3.5 text-amber-400/80 hover:text-amber-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Codec */}
                  {visibleColumns.codec && (
                    <td 
                      style={{ width: `${effectiveWidths.codec}px` }}
                      className={`${rowPadding} px-3 text-slate-300 font-mono text-[12px] overflow-hidden`}
                    >
                      <div className="flex flex-col">
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            onFilterByCodec(item.codec);
                          }}
                          className={`hover:text-blue-300 hover:underline cursor-pointer ${textCls}`}
                          title={`Filter by codec: ${item.codec}`}
                        >
                          {item.codec}
                        </span>
                        {item.audioCodec && (
                          <span className={`text-[10px] text-slate-500 ${textCls}`} title={item.audioCodec}>
                            {item.audioCodec}
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {/* Resolution */}
                  {visibleColumns.resolution && (
                    <td 
                      style={{ width: `${effectiveWidths.resolution}px` }}
                      className={`${rowPadding} px-3 font-mono text-[12px] overflow-hidden`}
                    >
                      {item.resolution && item.resolution !== '—' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onFilterByResolution?.(item.resolution!);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all hover:scale-105 ${
                            item.resolution.includes('4K') || item.resolution.includes('8K')
                              ? 'bg-purple-950/60 text-purple-300 border-purple-700/60 hover:bg-purple-900/80'
                              : item.resolution.includes('1080p')
                              ? 'bg-blue-950/60 text-blue-300 border-blue-700/60 hover:bg-blue-900/80'
                              : item.resolution.includes('720p')
                              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60 hover:bg-cyan-900/80'
                              : item.resolution.includes('1440p')
                              ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60 hover:bg-indigo-900/80'
                              : item.resolution.includes('480p') || item.resolution.includes('576p')
                              ? 'bg-amber-950/60 text-amber-300 border-amber-700/60 hover:bg-amber-900/80'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                          title={`Filter by resolution: ${item.resolution}`}
                        >
                          {item.resolution}
                        </button>
                      ) : (
                        <span className="text-slate-600 select-none text-[11px]">—</span>
                      )}
                    </td>
                  )}

                  {/* Extension */}
                  {visibleColumns.extension && (
                    <td 
                      style={{ width: `${effectiveWidths.extension}px` }}
                      className={`${rowPadding} px-3 font-mono text-[12px] overflow-hidden`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFilterByExtension(item.extension);
                        }}
                        className="text-slate-300 hover:text-emerald-300 hover:underline uppercase font-semibold"
                        title={`Filter by .${item.extension}`}
                      >
                        .{item.extension}
                      </button>
                    </td>
                  )}

                  {/* Size */}
                  {visibleColumns.size && (
                    <td 
                      style={{ width: `${effectiveWidths.size}px` }}
                      className={`${rowPadding} px-3 text-right font-mono text-[12px] tabular-nums text-slate-200 overflow-hidden`}
                    >
                      <span title={`${item.size.toLocaleString()} bytes`}>
                        {item.sizeFormatted}
                      </span>
                    </td>
                  )}

                  {/* Row Actions */}
                  <td 
                    style={{ width: `${effectiveWidths.actions}px` }} 
                    className={`${rowPadding} px-2 text-center`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => handleOpenFile(item.fullPath, e)}
                        className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Open file in default system application"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectItem(item);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                        title="View file details"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmationItems([item]);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete file from filesystem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 sm:px-6 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="font-mono">
            Page <span className="text-white font-semibold">{currentPage}</span> of <span className="text-white font-semibold">{totalPages}</span>
            <span className="text-slate-500 ml-2">({items.length} total files)</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 rounded text-slate-200 transition-colors flex items-center gap-1 font-mono text-[11px]"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">First</span>
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 rounded text-slate-200 transition-colors flex items-center gap-1 font-mono text-[11px]"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Sliding Page Window */}
            <div className="flex items-center gap-1 font-mono">
              {visiblePages.map((page, idx) => {
                if (page === 'ellipsis') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-500 select-none">
                      …
                    </span>
                  );
                }
                const pageNum = page as number;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-7 h-7 px-1.5 rounded text-xs transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-900/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title={`Page ${pageNum}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 rounded text-slate-200 transition-colors flex items-center gap-1 font-mono text-[11px]"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 rounded text-slate-200 transition-colors flex items-center gap-1 font-mono text-[11px]"
              title="Last Page"
            >
              <span className="hidden sm:inline">Last</span>
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteConfirmationItems}
        itemsToDelete={deleteConfirmationItems || []}
        onCancel={() => setDeleteConfirmationItems(null)}
        onConfirm={() => {
          if (deleteConfirmationItems && onDeleteItems) {
            onDeleteItems(deleteConfirmationItems);
          }
          setDeleteConfirmationItems(null);
        }}
      />
    </div>
  );
};
