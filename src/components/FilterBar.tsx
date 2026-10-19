import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, SlidersHorizontal, Folder, Cpu, FileCode, HardDrive, Monitor } from 'lucide-react';
import { FilterState, MediaItem, MediaType } from '../types/media';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  items: MediaItem[];
  totalFilteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  items,
  totalFilteredCount
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minSizeInput, setMinSizeInput] = useState('');
  const [maxSizeInput, setMaxSizeInput] = useState('');
  const [sizeUnit, setSizeUnit] = useState<'MB' | 'GB'>('MB');

  // Extract unique folders, codecs, resolutions, and extensions with counts
  const folderCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(i => map.set(i.folder, (map.get(i.folder) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const codecCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(i => map.set(i.codec, (map.get(i.codec) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const resolutionCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(i => {
      if (i.resolution && i.resolution !== '—') {
        map.set(i.resolution, (map.get(i.resolution) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const extensionCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(i => map.set(i.extension, (map.get(i.extension) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // Has any active filter
  const hasActiveFilters = 
    filters.searchQuery.trim() !== '' ||
    filters.folderQuery.trim() !== '' ||
    filters.selectedFolders.length > 0 ||
    filters.selectedCodecs.length > 0 ||
    (filters.selectedResolutions && filters.selectedResolutions.length > 0) ||
    filters.selectedExtensions.length > 0 ||
    filters.selectedTypes.length > 0 ||
    filters.minSizeBytes !== null ||
    filters.maxSizeBytes !== null ||
    filters.sizePreset !== 'all';

  const resetAllFilters = () => {
    setMinSizeInput('');
    setMaxSizeInput('');
    onFilterChange({
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
  };

  const toggleCodec = (codec: string) => {
    const exists = filters.selectedCodecs.includes(codec);
    const updated = exists 
      ? filters.selectedCodecs.filter(c => c !== codec)
      : [...filters.selectedCodecs, codec];
    onFilterChange({ ...filters, selectedCodecs: updated });
  };

  const toggleResolution = (res: string) => {
    const list = filters.selectedResolutions || [];
    const exists = list.includes(res);
    const updated = exists 
      ? list.filter(r => r !== res)
      : [...list, res];
    onFilterChange({ ...filters, selectedResolutions: updated });
  };

  const toggleExtension = (ext: string) => {
    const exists = filters.selectedExtensions.includes(ext);
    const updated = exists 
      ? filters.selectedExtensions.filter(e => e !== ext)
      : [...filters.selectedExtensions, ext];
    onFilterChange({ ...filters, selectedExtensions: updated });
  };

  const setPreset = (preset: FilterState['sizePreset']) => {
    let minBytes: number | null = null;
    let maxBytes: number | null = null;

    if (preset === 'under10mb') {
      maxBytes = 10 * 1024 * 1024;
    } else if (preset === '10to100mb') {
      minBytes = 10 * 1024 * 1024;
      maxBytes = 100 * 1024 * 1024;
    } else if (preset === '100to1gb') {
      minBytes = 100 * 1024 * 1024;
      maxBytes = 1024 * 1024 * 1024;
    } else if (preset === 'over1gb') {
      minBytes = 1024 * 1024 * 1024;
    }

    setMinSizeInput(minBytes ? String(Math.round(minBytes / (1024 * 1024))) : '');
    setMaxSizeInput(maxBytes ? String(Math.round(maxBytes / (1024 * 1024))) : '');
    setSizeUnit('MB');

    onFilterChange({
      ...filters,
      sizePreset: preset,
      minSizeBytes: minBytes,
      maxSizeBytes: maxBytes
    });
  };

  const applyCustomSize = () => {
    const multiplier = sizeUnit === 'GB' ? 1024 * 1024 * 1024 : 1024 * 1024;
    const min = minSizeInput ? parseFloat(minSizeInput) * multiplier : null;
    const max = maxSizeInput ? parseFloat(maxSizeInput) * multiplier : null;

    onFilterChange({
      ...filters,
      sizePreset: 'all',
      minSizeBytes: isNaN(min as number) ? null : min,
      maxSizeBytes: isNaN(max as number) ? null : max
    });
  };

  const toggleMediaType = (type: MediaType) => {
    const exists = filters.selectedTypes.includes(type);
    const updated = exists 
      ? filters.selectedTypes.filter(t => t !== type)
      : [...filters.selectedTypes, type];
    onFilterChange({ ...filters, selectedTypes: updated });
  };

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4">
      <div className="w-full space-y-3">
        {/* Row 1: Primary Search Inputs (File Name & Folder) + Type Segments */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* File Name Filter */}
          <div className="relative md:col-span-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Filter by file name..."
              className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Folder Filter */}
          <div className="relative md:col-span-4">
            <Folder className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.folderQuery}
              onChange={(e) => onFilterChange({ ...filters, folderQuery: e.target.value })}
              placeholder="Filter by Windows folder path..."
              className="w-full pl-9 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            />
            {filters.folderQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, folderQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Media Type Segmented Buttons */}
          <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-800/80 border border-slate-700/60 rounded-lg">
              <button
                onClick={() => onFilterChange({ ...filters, selectedTypes: [] })}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filters.selectedTypes.length === 0
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => toggleMediaType('video')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filters.selectedTypes.includes('video')
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Video
              </button>
              <button
                onClick={() => toggleMediaType('audio')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filters.selectedTypes.includes('audio')
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Audio
              </button>
              <button
                onClick={() => toggleMediaType('image')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filters.selectedTypes.includes('image')
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Images
              </button>
            </div>

            {/* Toggle Advanced Filters Button */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`p-2 text-xs font-medium border rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                showAdvanced || filters.selectedCodecs.length > 0 || (filters.selectedResolutions && filters.selectedResolutions.length > 0) || filters.selectedExtensions.length > 0 || filters.minSizeBytes !== null
                  ? 'bg-blue-950/60 text-blue-300 border-blue-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle Codec, Resolution, Extension, and Size filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Column Filters</span>
              {(filters.selectedCodecs.length > 0 || (filters.selectedResolutions && filters.selectedResolutions.length > 0) || filters.selectedExtensions.length > 0 || filters.minSizeBytes !== null) && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              )}
            </button>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="p-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors"
                title="Reset all filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Advanced Column Filter Drawers (Codec, Resolution, Extension, Size) */}
        {showAdvanced && (
          <div className="pt-3 pb-1 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Column 1: Codec Filter */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  Filter by Codec ({codecCounts.length})
                </span>
                {filters.selectedCodecs.length > 0 && (
                  <button
                    onClick={() => onFilterChange({ ...filters, selectedCodecs: [] })}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {codecCounts.length === 0 ? (
                  <p className="text-slate-500 text-[11px]">No codecs detected yet</p>
                ) : (
                  codecCounts.map(([codec, count]) => {
                    const isSelected = filters.selectedCodecs.includes(codec);
                    return (
                      <button
                        key={codec}
                        onClick={() => toggleCodec(codec)}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        <span className="truncate mr-2">{codec}</span>
                        <span className="tabular-nums text-slate-400">{count}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 2: Resolution Filter */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-purple-400" />
                  Filter by Resolution ({resolutionCounts.length})
                </span>
                {filters.selectedResolutions && filters.selectedResolutions.length > 0 && (
                  <button
                    onClick={() => onFilterChange({ ...filters, selectedResolutions: [] })}
                    className="text-[11px] text-purple-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {resolutionCounts.length === 0 ? (
                  <p className="text-slate-500 text-[11px]">No resolutions detected yet</p>
                ) : (
                  resolutionCounts.map(([res, count]) => {
                    const isSelected = filters.selectedResolutions?.includes(res);
                    return (
                      <button
                        key={res}
                        onClick={() => toggleResolution(res)}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-purple-600 text-white font-medium'
                            : 'text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        <span className="truncate mr-2">{res}</span>
                        <span className="tabular-nums text-slate-400">{count}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: Extension Filter */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  Filter by Extension ({extensionCounts.length})
                </span>
                {filters.selectedExtensions.length > 0 && (
                  <button
                    onClick={() => onFilterChange({ ...filters, selectedExtensions: [] })}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {extensionCounts.length === 0 ? (
                  <p className="text-slate-500 text-[11px]">No extensions available</p>
                ) : (
                  extensionCounts.map(([ext, count]) => {
                    const isSelected = filters.selectedExtensions.includes(ext);
                    return (
                      <button
                        key={ext}
                        onClick={() => toggleExtension(ext)}
                        className={`w-full text-left px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-medium'
                            : 'text-slate-300 hover:bg-slate-700/60'
                        }`}
                      >
                        <span className="uppercase font-semibold">.{ext}</span>
                        <span className="tabular-nums text-slate-400">{count} files</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Column 3: File Size Filter */}
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3 flex flex-col justify-between">
              <div>
                <span className="font-semibold text-slate-200 flex items-center gap-1.5 mb-2">
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  Filter by File Size
                </span>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  <button
                    onClick={() => setPreset('all')}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-colors text-center ${
                      filters.sizePreset === 'all' && filters.minSizeBytes === null && filters.maxSizeBytes === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Any Size
                  </button>
                  <button
                    onClick={() => setPreset('under10mb')}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-colors text-center ${
                      filters.sizePreset === 'under10mb'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    &lt; 10 MB
                  </button>
                  <button
                    onClick={() => setPreset('10to100mb')}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-colors text-center ${
                      filters.sizePreset === '10to100mb'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    10 - 100 MB
                  </button>
                  <button
                    onClick={() => setPreset('100to1gb')}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-colors text-center ${
                      filters.sizePreset === '100to1gb'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    100 MB - 1 GB
                  </button>
                  <button
                    onClick={() => setPreset('over1gb')}
                    className={`px-2 py-1 col-span-2 rounded text-[11px] font-mono transition-colors text-center ${
                      filters.sizePreset === 'over1gb'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    &gt; 1 GB (High-res Video)
                  </button>
                </div>
              </div>

              {/* Custom Min / Max range */}
              <div className="pt-2 border-t border-slate-700/60">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={minSizeInput}
                    onChange={(e) => setMinSizeInput(e.target.value)}
                    placeholder="Min"
                    className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-white font-mono text-center focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="number"
                    value={maxSizeInput}
                    onChange={(e) => setMaxSizeInput(e.target.value)}
                    placeholder="Max"
                    className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-white font-mono text-center focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={sizeUnit}
                    onChange={(e) => setSizeUnit(e.target.value as 'MB' | 'GB')}
                    className="px-1 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] text-slate-300 font-mono"
                  >
                    <option value="MB">MB</option>
                    <option value="GB">GB</option>
                  </select>
                  <button
                    onClick={applyCustomSize}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition-colors"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips indicator */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="text-slate-500">Active filters:</span>
            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-blue-300 rounded font-mono text-[11px]">
                Name contains "{filters.searchQuery}"
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => onFilterChange({ ...filters, searchQuery: '' })} />
              </span>
            )}
            {filters.folderQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-blue-300 rounded font-mono text-[11px]">
                Folder: "{filters.folderQuery}"
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => onFilterChange({ ...filters, folderQuery: '' })} />
              </span>
            )}
            {filters.selectedCodecs.map(c => (
              <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-blue-300 rounded font-mono text-[11px]">
                Codec: {c}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => toggleCodec(c)} />
              </span>
            ))}
            {filters.selectedResolutions?.map(r => (
              <span key={r} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-purple-300 rounded font-mono text-[11px]">
                Resolution: {r}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => toggleResolution(r)} />
              </span>
            ))}
            {filters.selectedExtensions.map(e => (
              <span key={e} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-emerald-300 rounded font-mono text-[11px]">
                .{e}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => toggleExtension(e)} />
              </span>
            ))}
            {(filters.minSizeBytes !== null || filters.maxSizeBytes !== null) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-amber-300 rounded font-mono text-[11px]">
                Size: {filters.sizePreset !== 'all' ? filters.sizePreset : 'custom'}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setPreset('all')} />
              </span>
            )}
            <button
              onClick={resetAllFilters}
              className="text-[11px] text-rose-400 hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
