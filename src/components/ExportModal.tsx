import React, { useState, useMemo } from 'react';
import { X, Download, Copy, Check, FileSpreadsheet, Settings } from 'lucide-react';
import { MediaItem, CsvExportOptions } from '../types/media.ts';
import { generateCsv, downloadCsvFile } from '../utils/csvExporter.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allItems: MediaItem[];
  filteredItems: MediaItem[];
  selectedItems: MediaItem[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  allItems,
  filteredItems,
  selectedItems
}) => {
  const [scope, setScope] = useState<'filtered' | 'all' | 'selected'>(
    selectedItems.length > 0 ? 'selected' : 'filtered'
  );
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',');
  const [includeBOM, setIncludeBOM] = useState<boolean>(true);
  const [windowsPathStyle, setWindowsPathStyle] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const [columns, setColumns] = useState({
    fileName: true,
    folder: true,
    fullPath: true,
    codec: true,
    audioCodec: true,
    resolution: true,
    extension: true,
    sizeBytes: true,
    sizeFormatted: true,
    type: true,
    lastModified: true,
    duration: false,
    dimensions: false
  });

  const defaultFileName = useMemo(() => {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return `WinMedia_Export_${dateStr}.csv`;
  }, []);

  const [fileName, setFileName] = useState(defaultFileName);

  const targetItems = useMemo(() => {
    if (scope === 'selected' && selectedItems.length > 0) return selectedItems;
    if (scope === 'all') return allItems;
    return filteredItems;
  }, [scope, selectedItems, allItems, filteredItems]);

  const exportOptions: CsvExportOptions = useMemo(() => ({
    scope,
    delimiter,
    includeBOM,
    windowsPathStyle,
    columns
  }), [scope, delimiter, includeBOM, windowsPathStyle, columns]);

  const csvContent = useMemo(() => {
    return generateCsv(targetItems, exportOptions);
  }, [targetItems, exportOptions]);

  const previewLines = useMemo(() => {
    const cleanContent = csvContent.replace(/^\uFEFF/, '');
    const lines = cleanContent.split('\r\n');
    return lines.slice(0, 6).join('\n');
  }, [csvContent]);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadCsvFile(csvContent, fileName || 'media_catalog.csv');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(csvContent.replace(/^\uFEFF/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleColumn = (key: keyof typeof columns) => {
    setColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Media to CSV</h2>
              <p className="text-xs text-slate-400">
                Generate clean, Excel-compatible CSV of scanned media files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Scope selection */}
          <div>
            <label className="font-semibold text-slate-300 block mb-2">Export Scope</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('filtered')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  scope === 'filtered'
                    ? 'border-blue-500 bg-blue-950/40 text-white'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold">Filtered List</div>
                <div className="font-mono text-[11px] text-slate-400">{filteredItems.length} media files</div>
              </button>

              <button
                type="button"
                onClick={() => setScope('all')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  scope === 'all'
                    ? 'border-blue-500 bg-blue-950/40 text-white'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold">Full Library</div>
                <div className="font-mono text-[11px] text-slate-400">{allItems.length} media files</div>
              </button>

              <button
                type="button"
                disabled={selectedItems.length === 0}
                onClick={() => setScope('selected')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedItems.length === 0
                    ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-800/20 text-slate-500'
                    : scope === 'selected'
                    ? 'border-blue-500 bg-blue-950/40 text-white'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold">Selected Only</div>
                <div className="font-mono text-[11px] text-slate-400">
                  {selectedItems.length} files chosen
                </div>
              </button>
            </div>
          </div>

          {/* Windows formatting options */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3 space-y-3">
            <span className="font-semibold text-slate-300 block">CSV & Windows Compatibility Settings</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={windowsPathStyle}
                  onChange={(e) => setWindowsPathStyle(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-300">Windows Backslashes (<code className="text-blue-300">\</code>)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBOM}
                  onChange={(e) => setIncludeBOM(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-300">Include UTF-8 BOM (for MS Excel)</span>
              </label>
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-slate-800/80">
              <span className="text-slate-400">Delimiter:</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="delimiter"
                    checked={delimiter === ','}
                    onChange={() => setDelimiter(',')}
                    className="text-blue-600"
                  />
                  <span>Comma (,)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="delimiter"
                    checked={delimiter === ';'}
                    onChange={() => setDelimiter(';')}
                    className="text-blue-600"
                  />
                  <span>Semicolon (;)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="delimiter"
                    checked={delimiter === '\t'}
                    onChange={() => setDelimiter('\t')}
                    className="text-blue-600"
                  />
                  <span>Tab (TSV)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Included Columns */}
          <div>
            <label className="font-semibold text-slate-300 block mb-2">Columns to Include</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {([
                ['fileName', 'File Name'],
                ['folder', 'Folder'],
                ['fullPath', 'Full Path'],
                ['codec', 'Codec'],
                ['audioCodec', 'Audio Codec'],
                ['resolution', 'Resolution'],
                ['extension', 'Extension'],
                ['sizeBytes', 'Size (Bytes)'],
                ['sizeFormatted', 'Size (Formatted)'],
                ['type', 'Media Type'],
                ['lastModified', 'Last Modified']
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 p-1.5 bg-slate-800/50 rounded border border-slate-800 cursor-pointer hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={columns[key]}
                    onChange={() => toggleColumn(key)}
                    className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-300 truncate">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Output Filename */}
          <div>
            <label className="font-semibold text-slate-300 block mb-1">CSV File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Live Preview */}
          <div>
            <label className="font-semibold text-slate-400 block mb-1">CSV Preview (First 5 Rows)</label>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre">
              {previewLines}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <div className="text-xs text-slate-400 font-mono">
            {targetItems.length} records ready to export
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy CSV</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
