export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0 || isNaN(bytes)) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, sizes.length - 1);
  const formattedValue = parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(dm));

  return `${formattedValue.toLocaleString()} ${sizes[unitIndex]}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function normalizeWindowsPath(path: string, rootPrefix?: string): string {
  let normalized = path.replace(/\//g, '\\');
  // Collapse multiple backslashes except leading \\ (UNC paths)
  if (normalized.startsWith('\\\\')) {
    normalized = '\\\\' + normalized.slice(2).replace(/\\+/g, '\\');
  } else {
    normalized = normalized.replace(/\\+/g, '\\');
  }

  // If rootPrefix is provided and path doesn't already start with a drive letter (e.g. C:)
  if (rootPrefix) {
    let cleanPrefix = rootPrefix.replace(/\//g, '\\').replace(/\\+$/, '');
    if (!/^[a-zA-Z]:/.test(normalized) && !normalized.startsWith('\\\\')) {
      const relative = normalized.replace(/^\\+/, '');
      normalized = relative ? `${cleanPrefix}\\${relative}` : cleanPrefix;
    }
  }

  return normalized;
}

export function formatDate(timestamp?: number | Date): string {
  if (!timestamp) return '—';
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  if (isNaN(d.getTime())) return '—';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function formatDuration(seconds?: number): string {
  if (seconds === undefined || isNaN(seconds)) return '—';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
