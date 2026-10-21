import { MediaItem, CsvExportOptions } from '../types/media.ts';

export function generateCsv(items: MediaItem[], options: CsvExportOptions): string {
  const delimiter = options.delimiter || ',';
  const rows: string[] = [];

  // Determine headers
  const headers: string[] = [];
  if (options.columns.fileName) headers.push('File Name');
  if (options.columns.folder) headers.push('Folder');
  if (options.columns.fullPath) headers.push('Full Path');
  if (options.columns.codec) headers.push('Codec');
  if (options.columns.audioCodec) headers.push('Audio Codec');
  if (options.columns.resolution) headers.push('Resolution');
  if (options.columns.extension) headers.push('Extension');
  if (options.columns.sizeBytes) headers.push('Size (Bytes)');
  if (options.columns.sizeFormatted) headers.push('Size (Formatted)');
  if (options.columns.type) headers.push('Media Type');
  if (options.columns.lastModified) headers.push('Last Modified');

  rows.push(headers.map(h => escapeCsvCell(h, delimiter)).join(delimiter));

  for (const item of items) {
    const rowValues: string[] = [];

    const folderDisplay = options.windowsPathStyle 
      ? item.folder.replace(/\//g, '\\') 
      : item.folder.replace(/\\/g, '/');

    const fullPathDisplay = options.windowsPathStyle 
      ? item.fullPath.replace(/\//g, '\\') 
      : item.fullPath.replace(/\\/g, '/');

    if (options.columns.fileName) rowValues.push(item.name);
    if (options.columns.folder) rowValues.push(folderDisplay);
    if (options.columns.fullPath) rowValues.push(fullPathDisplay);
    if (options.columns.codec) rowValues.push(item.codec);
    if (options.columns.audioCodec) rowValues.push(item.audioCodec || '');
    if (options.columns.resolution) rowValues.push(item.resolution || '');
    if (options.columns.extension) rowValues.push(item.extension);
    if (options.columns.sizeBytes) rowValues.push(String(item.size));
    if (options.columns.sizeFormatted) rowValues.push(item.sizeFormatted);
    if (options.columns.type) rowValues.push(item.type);
    if (options.columns.lastModified) rowValues.push(item.lastModifiedFormatted || '');

    rows.push(rowValues.map(v => escapeCsvCell(v, delimiter)).join(delimiter));
  }

  const csvBody = rows.join('\r\n');
  return options.includeBOM ? '\uFEFF' + csvBody : csvBody;
}

function escapeCsvCell(cell: string, delimiter: string): string {
  if (cell === null || cell === undefined) return '';
  const str = String(cell);
  const needsQuotes = str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r');
  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsvFile(csvContent: string, fileName = 'media_files_export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
