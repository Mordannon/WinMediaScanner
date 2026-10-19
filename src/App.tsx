import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ScanHero } from './components/ScanHero';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
import { MediaTableView } from './components/MediaTableView';
import { FolderTreeView } from './components/FolderTreeView';
import { ExportModal } from './components/ExportModal';
import { FileDetailsModal } from './components/FileDetailsModal';
import { SAMPLE_MEDIA_LIBRARY } from './utils/sampleData';
import { EXTENSION_DEFAULT_CODEC, extractResolution } from './utils/codecDetector';
import { formatBytes, formatDate } from './utils/formatters';
import { 
  MediaItem, 
  FilterState, 
  SortColumn, 
  SortDirection, 
  ScanProgress 
} from './types/media';
import { 
  scanDirectoryHandle, 
  scanFileList, 
  scanDroppedEntries 
} from './utils/scanner';

export default function App() {
  // Main media library state: starts empty so user sees only their actual scanned files
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'tree'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectedItem, setInspectedItem] = useState<MediaItem | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Windows root prefix configuration: empty by default so it reflects actual folder selected
  const [windowsPrefix, setWindowsPrefix] = useState<string>('');

  // Scanning state
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    isScanning: false,
    currentFolder: '',
    scannedFilesCount: 0,
    mediaFilesCount: 0,
    totalBytes: 0,
    elapsedMs: 0
  });

  const cancelScanRef = useRef<boolean>(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    folderQuery: '',
    selectedFolders: [],
    selectedCodecs: [],
    selectedResolutions: [],
    selectedExtensions: [],
    selectedTypes: [],
    minSizeBytes: null,
    maxSizeBytes: null,
    sizePreset: 'all'
  });

  // Listen to Electron native scan progress and discovered items
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      const unsubProgress = window.electronAPI.onScanProgress?.((progress: ScanProgress) => {
        setScanProgress(progress);
      });

      let buffer: MediaItem[] = [];
      let timeoutId: any = null;

      const flushBuffer = () => {
        if (buffer.length > 0) {
          const batch = buffer.slice();
          buffer = [];
          setItems(prev => [...prev, ...batch]);
        }
      };

      const pushFileToBuffer = (f: any) => {
        const fallback = EXTENSION_DEFAULT_CODEC[f.extension] || {
          codec: f.extension ? `${f.extension.toUpperCase()} Stream` : 'Media Stream',
          type: f.type || 'other'
        };
        const item: MediaItem = {
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: f.name,
          folder: f.folder.replace(/\//g, '\\'),
          fullPath: f.fullPath.replace(/\//g, '\\'),
          codec: f.codec || fallback.codec,
          audioCodec: f.audioCodec || fallback.audioCodec,
          extension: f.extension,
          resolution: f.resolution || extractResolution(f.name, undefined, undefined, f.type || fallback.type),
          size: f.size,
          sizeFormatted: formatBytes(f.size),
          type: f.type || fallback.type,
          lastModified: f.lastModified,
          lastModifiedFormatted: formatDate(f.lastModified)
        };
        buffer.push(item);

        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            flushBuffer();
            timeoutId = null;
          }, 80);
        }
      };

      const unsubItem = window.electronAPI.onScanItem?.((f: any) => {
        pushFileToBuffer(f);
      });

      const unsubBatch = (window.electronAPI as any).onScanItemsBatch?.((files: any[]) => {
        if (Array.isArray(files)) {
          files.forEach(pushFileToBuffer);
        }
      });

      return () => {
        if (typeof unsubProgress === 'function') unsubProgress();
        if (typeof unsubItem === 'function') unsubItem();
        if (typeof unsubBatch === 'function') unsubBatch();
        if (timeoutId) clearTimeout(timeoutId);
        flushBuffer();
      };
    }
  }, []);

  // Handle folder scanning directly without any warning modals
  const handleOpenFolderPicker = async () => {
    // 1. If running inside Electron desktop app (.exe), use native Windows explorer dialog & native file traversal
    if (typeof window !== 'undefined' && (window as any).electronAPI?.selectFolder) {
      try {
        const selectedDir = await (window as any).electronAPI.selectFolder();
        if (!selectedDir) {
          return; // User cancelled Windows folder picker
        }

        cancelScanRef.current = false;
        setItems([]);
        setSelectedIds(new Set());
        setScanProgress({
          isScanning: true,
          currentFolder: selectedDir,
          scannedFilesCount: 0,
          mediaFilesCount: 0,
          totalBytes: 0,
          elapsedMs: 0
        });

        const nativeResults = await (window as any).electronAPI.scanDirectoryNative(selectedDir);
        if (cancelScanRef.current) return;

        // Map native results with real paths and accurately inspected codecs
        const scannedItems: MediaItem[] = nativeResults.map((f: any, idx: number) => {
          const fallback = EXTENSION_DEFAULT_CODEC[f.extension] || {
            codec: f.extension ? `${f.extension.toUpperCase()} Stream` : 'Media Stream',
            type: f.type || 'other'
          };
          const codec = f.codec || fallback.codec;
          const audioCodec = f.audioCodec || fallback.audioCodec;

          return {
            id: `file_${Date.now()}_${idx}`,
            name: f.name,
            folder: f.folder.replace(/\//g, '\\'),
            fullPath: f.fullPath.replace(/\//g, '\\'),
            codec,
            audioCodec,
            extension: f.extension,
            resolution: f.resolution || extractResolution(f.name, undefined, undefined, f.type || fallback.type),
            size: f.size,
            sizeFormatted: formatBytes(f.size),
            type: f.type || fallback.type,
            lastModified: f.lastModified,
            lastModifiedFormatted: formatDate(f.lastModified)
          };
        });

        setItems(scannedItems);
        setSelectedIds(new Set());
        setScanProgress(prev => ({
          ...prev,
          isScanning: false,
          currentFolder: `Scan completed: ${scannedItems.length} media files found`
        }));
        return;
      } catch (err) {
        console.error('Electron native folder scan error:', err);
      } finally {
        setScanProgress(prev => ({ ...prev, isScanning: false }));
      }
    }

    // 2. Standard Web browser environment: try showDirectoryPicker if supported and top-level
    const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (!isInIframe && 'showDirectoryPicker' in window) {
      try {
        cancelScanRef.current = false;
        // @ts-expect-error showDirectoryPicker is supported in top-level Chrome & Edge
        const dirHandle = await window.showDirectoryPicker({
          mode: 'read'
        });

        const rootDisplay = windowsPrefix || `C:\\${dirHandle.name}`;

        setItems([]);
        setSelectedIds(new Set());
        setScanProgress({
          isScanning: true,
          currentFolder: rootDisplay,
          scannedFilesCount: 0,
          mediaFilesCount: 0,
          totalBytes: 0,
          elapsedMs: 0
        });

        const scannedItems = await scanDirectoryHandle(dirHandle, {
          mediaOnly: true,
          windowsDrivePrefix: rootDisplay,
          onProgress: (p) => setScanProgress(p),
          onItemDiscovered: (item) => {
            setItems(prev => [...prev, item]);
          },
          shouldCancel: () => cancelScanRef.current
        });

        if (!cancelScanRef.current && scannedItems.length > 0) {
          setItems(scannedItems);
          setSelectedIds(new Set());
        }
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return; // user cancelled the picker
        }
        // If security error (cross origin iframe), fall through to directory input below
      }
    }

    // 3. Universal directory input fallback: works in cross-origin iframes and all browsers
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
      folderInputRef.current.click();
    }
  };

  // Handle FileList from <input type="file" webkitdirectory>
  const handleFileListSelected = async (fileList: FileList) => {
    cancelScanRef.current = false;
    setItems([]);
    setSelectedIds(new Set());
    setScanProgress({
      isScanning: true,
      currentFolder: 'Analyzing files...',
      scannedFilesCount: 0,
      mediaFilesCount: 0,
      totalBytes: 0,
      elapsedMs: 0
    });

    try {
      const scannedItems = await scanFileList(fileList, {
        mediaOnly: true,
        windowsDrivePrefix: windowsPrefix,
        onProgress: (p) => setScanProgress(p),
        onItemDiscovered: (item) => {
          setItems(prev => [...prev, item]);
        },
        shouldCancel: () => cancelScanRef.current
      });

      if (!cancelScanRef.current && scannedItems.length > 0) {
        setItems(scannedItems);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error('File list scan error:', err);
    } finally {
      setScanProgress(prev => ({ ...prev, isScanning: false }));
    }
  };

  // Handle Drag & Drop folders
  const handleDropFiles = async (dataTransferItems: DataTransferItemList) => {
    cancelScanRef.current = false;
    setItems([]);
    setSelectedIds(new Set());
    setScanProgress({
      isScanning: true,
      currentFolder: 'Traversing dropped folders...',
      scannedFilesCount: 0,
      mediaFilesCount: 0,
      totalBytes: 0,
      elapsedMs: 0
    });

    try {
      const scannedItems = await scanDroppedEntries(dataTransferItems, {
        mediaOnly: true,
        windowsDrivePrefix: windowsPrefix,
        onProgress: (p) => setScanProgress(p),
        onItemDiscovered: (item) => {
          setItems(prev => [...prev, item]);
        },
        shouldCancel: () => cancelScanRef.current
      });

      if (!cancelScanRef.current && scannedItems.length > 0) {
        setItems(scannedItems);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error('Drop scan error:', err);
    } finally {
      setScanProgress(prev => ({ ...prev, isScanning: false }));
    }
  };

  const handleCancelScan = () => {
    cancelScanRef.current = true;
    setScanProgress(prev => ({ ...prev, isScanning: false }));
  };

  const handleLoadSample = () => {
    setItems(SAMPLE_MEDIA_LIBRARY);
    setSelectedIds(new Set());
  };

  // Sorting handler
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredItems.map(i => i.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Quick filter shortcuts
  const handleFilterByFolder = (folder: string) => {
    setFilters(prev => ({ ...prev, folderQuery: folder }));
  };

  const handleFilterByCodec = (codec: string) => {
    setFilters(prev => ({
      ...prev,
      selectedCodecs: prev.selectedCodecs.includes(codec) ? prev.selectedCodecs : [...prev.selectedCodecs, codec]
    }));
  };

  const handleFilterByResolution = (res: string) => {
    setFilters(prev => ({
      ...prev,
      selectedResolutions: (prev.selectedResolutions || []).includes(res)
        ? prev.selectedResolutions
        : [...(prev.selectedResolutions || []), res]
    }));
  };

  const handleFilterByExtension = (ext: string) => {
    setFilters(prev => ({
      ...prev,
      selectedExtensions: prev.selectedExtensions.includes(ext) ? prev.selectedExtensions : [...prev.selectedExtensions, ext]
    }));
  };

  const handleOpenFolder = async (folderPath: string) => {
    if (typeof window !== 'undefined' && window.electronAPI?.openFolder) {
      try {
        await window.electronAPI.openFolder(folderPath);
      } catch (err) {
        console.error('Failed to open folder:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(folderPath);
      } catch {}
    }
  };

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. File name text query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(query)) return false;
      }

      // 2. Folder text query
      if (filters.folderQuery.trim()) {
        const fQuery = filters.folderQuery.toLowerCase();
        if (!item.folder.toLowerCase().includes(fQuery)) return false;
      }

      // 3. Selected folders
      if (filters.selectedFolders.length > 0) {
        if (!filters.selectedFolders.includes(item.folder)) return false;
      }

      // 4. Codecs
      if (filters.selectedCodecs.length > 0) {
        if (!filters.selectedCodecs.includes(item.codec)) return false;
      }

      // 5. Resolutions
      if (filters.selectedResolutions && filters.selectedResolutions.length > 0) {
        if (!item.resolution || !filters.selectedResolutions.includes(item.resolution)) return false;
      }

      // 6. Extensions
      if (filters.selectedExtensions.length > 0) {
        if (!filters.selectedExtensions.includes(item.extension)) return false;
      }

      // 7. Media Types
      if (filters.selectedTypes.length > 0) {
        if (!filters.selectedTypes.includes(item.type)) return false;
      }

      // 8. Size range
      if (filters.minSizeBytes !== null && item.size < filters.minSizeBytes) {
        return false;
      }
      if (filters.maxSizeBytes !== null && item.size > filters.maxSizeBytes) {
        return false;
      }

      return true;
    });
  }, [items, filters]);

  const sortedAndFilteredItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'name':
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
          break;
        case 'folder':
          comparison = a.folder.localeCompare(b.folder, undefined, { numeric: true });
          break;
        case 'codec':
          comparison = a.codec.localeCompare(b.codec);
          break;
        case 'resolution':
          comparison = (a.resolution || '').localeCompare(b.resolution || '', undefined, { numeric: true });
          break;
        case 'extension':
          comparison = a.extension.localeCompare(b.extension);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'lastModified':
          comparison = (a.lastModified || 0) - (b.lastModified || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredItems, sortColumn, sortDirection]);

  const selectedItemsList = useMemo(() => {
    return items.filter(i => selectedIds.has(i.id));
  }, [items, selectedIds]);

  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  const handleOpenFile = async (filePath: string) => {
    if (!filePath) return;
    if (typeof window !== 'undefined' && window.electronAPI?.openFile) {
      try {
        await window.electronAPI.openFile(filePath);
      } catch (err) {
        console.error('Failed to open file natively:', err);
      }
    }
  };

  const handleDeleteFiles = async (itemsToDelete: MediaItem[]) => {
    if (!itemsToDelete || itemsToDelete.length === 0) return;

    const pathsToDelete = itemsToDelete.map(item => item.fullPath);
    let successCount = itemsToDelete.length;

    if (typeof window !== 'undefined' && window.electronAPI?.deleteFiles) {
      try {
        const res = await window.electronAPI.deleteFiles(pathsToDelete);
        if (res) {
          successCount = res.count;
        }
      } catch (err) {
        console.error('Error deleting files via Electron API:', err);
      }
    }

    // Remove deleted items from local state
    const deletedIdSet = new Set(itemsToDelete.map(i => i.id));
    setItems(prev => prev.filter(item => !deletedIdSet.has(item.id)));
    setSelectedIds(prev => {
      const next = new Set(prev);
      deletedIdSet.forEach(id => next.delete(id));
      return next;
    });

    if (inspectedItem && deletedIdSet.has(inspectedItem.id)) {
      setInspectedItem(null);
    }

    setDeleteToast(`Successfully deleted ${successCount} file${successCount === 1 ? '' : 's'}`);
    setTimeout(() => setDeleteToast(null), 4000);
  };

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          handleDropFiles(e.dataTransfer.items);
        }
      }}
      className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans relative"
    >
      {/* Toast Notification Banner */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-950 border border-rose-700/80 text-rose-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 font-mono text-xs">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          <span>{deleteToast}</span>
        </div>
      )}

      {/* Active top-edge scan progress bar */}
      {scanProgress.isScanning && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-slate-800">
          {scanProgress.percent !== undefined ? (
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
              style={{ width: `${Math.max(3, scanProgress.percent)}%` }}
            />
          ) : (
            <div className="animate-indeterminate-beam bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          )}
        </div>
      )}

      {/* Top Bar */}
      <Header
        onScanClick={handleOpenFolderPicker}
        onExportClick={() => setIsExportOpen(true)}
        activeView={activeView}
        onViewChange={setActiveView}
        mediaCount={items.length}
        isScanning={scanProgress.isScanning}
        discoveredCount={scanProgress.mediaFilesCount}
      />

      {/* Scanning Hero & Progress */}
      <ScanHero
        scanProgress={scanProgress}
        onCancelScan={handleCancelScan}
        windowsPrefix={windowsPrefix}
        onUpdateWindowsPrefix={setWindowsPrefix}
        mediaCount={items.length}
      />

      {/* Hidden universal directory input: recursively scans all files in selected Windows directory */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileListSelected(e.target.files);
          }
        }}
        // @ts-expect-error webkitdirectory is standard in HTML5 for directory picking
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />

      {/* Aggregate Statistics Bar */}
      <StatsBar
        items={items}
        filteredItems={filteredItems}
      />

      {/* Multi-Column Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        items={items}
        totalFilteredCount={filteredItems.length}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 w-full px-4 sm:px-6 py-4">
        {activeView === 'list' ? (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-md">
            <MediaTableView
              items={sortedAndFilteredItems}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onInspectItem={setInspectedItem}
              onFilterByFolder={handleFilterByFolder}
              onFilterByCodec={handleFilterByCodec}
              onFilterByResolution={handleFilterByResolution}
              onFilterByExtension={handleFilterByExtension}
              onScanFolder={handleOpenFolderPicker}
              onOpenFolder={handleOpenFolder}
              onOpenFile={handleOpenFile}
              onDeleteItems={handleDeleteFiles}
              isScanning={scanProgress.isScanning}
              scannedCount={scanProgress.mediaFilesCount}
            />
          </div>
        ) : (
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-md">
            <FolderTreeView
              items={sortedAndFilteredItems}
              onInspectItem={setInspectedItem}
              onFilterByFolder={(folder) => {
                handleFilterByFolder(folder);
                setActiveView('list');
              }}
              onOpenFolder={handleOpenFolder}
            />
          </div>
        )}
      </main>

      {/* CSV Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        allItems={items}
        filteredItems={filteredItems}
        selectedItems={selectedItemsList}
      />

      {/* File Inspector Modal */}
      <FileDetailsModal
        item={inspectedItem}
        onClose={() => setInspectedItem(null)}
        onFilterByFolder={handleFilterByFolder}
        onFilterByCodec={handleFilterByCodec}
        onDeleteFile={(item) => handleDeleteFiles([item])}
        onOpenFile={handleOpenFile}
      />
    </div>
  );
}
