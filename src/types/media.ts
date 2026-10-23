export type MediaType = 'video' | 'audio' | 'image' | 'other';

export interface MediaItem {
  id: string;
  name: string;
  folder: string; // e.g. "D:\Movies\Sci-Fi" or "\Movies\Sci-Fi"
  fullPath: string; // e.g. "D:\Movies\Sci-Fi\Inception (2010).mkv"
  codec: string; // e.g. "H.264 / AVC", "H.265 / HEVC", "AV1", "FLAC", "AAC", etc.
  codecDetails?: string; // e.g. "Main 10@L5.1" or "320 kbps CBR"
  audioCodec?: string; // e.g. "DTS-HD MA", "E-AC-3", "AAC"
  extension: string; // lowercase without leading dot, e.g. "mkv"
  size: number; // size in bytes
  sizeFormatted: string; // e.g. "4.25 GB"
  type: MediaType;
  lastModified?: number; // timestamp
  lastModifiedFormatted?: string;
  dimensions?: { width: number; height: number };
  resolution?: string; // e.g. "4K (2160p)", "1080p (FHD)", "720p (HD)", etc.
  duration?: number; // duration in seconds
  durationFormatted?: string;
  fileRef?: File;
  handle?: any; // FileSystemFileHandle if available
}

export interface FilterState {
  searchQuery: string;
  folderQuery: string;
  selectedFolders: string[];
  excludedFolders?: string[];
  selectedCodecs: string[];
  selectedResolutions: string[];
  selectedExtensions: string[];
  selectedTypes: MediaType[];
  minSizeBytes: number | null;
  maxSizeBytes: number | null;
  sizePreset: 'all' | 'under10mb' | '10to100mb' | '100to1gb' | 'over1gb';
}

export type SortColumn = 'name' | 'folder' | 'codec' | 'resolution' | 'extension' | 'size' | 'type' | 'lastModified';
export type SortDirection = 'asc' | 'desc';

export interface ScanProgress {
  isScanning: boolean;
  currentFolder: string;
  scannedFilesCount: number;
  mediaFilesCount: number;
  totalBytes: number;
  elapsedMs: number;
  totalFilesToScan?: number;
  percent?: number;
  error?: string;
}

export interface CsvExportOptions {
  scope: 'filtered' | 'all' | 'selected';
  delimiter: ',' | ';' | '\t';
  includeBOM: boolean;
  windowsPathStyle: boolean;
  columns: {
    fileName: boolean;
    folder: boolean;
    fullPath: boolean;
    codec: boolean;
    audioCodec: boolean;
    resolution: boolean;
    extension: boolean;
    sizeBytes: boolean;
    sizeFormatted: boolean;
    type: boolean;
    lastModified: boolean;
    duration: boolean;
    dimensions: boolean;
  };
}

export interface ElectronScannedFile {
  name: string;
  folder: string;
  fullPath: string;
  extension: string;
  codec?: string;
  audioCodec?: string;
  resolution?: string;
  size: number;
  lastModified: number;
  type: MediaType;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      selectFolder: () => Promise<string | null>;
      scanDirectoryNative: (folderPath: string) => Promise<ElectronScannedFile[]>;
      openFolder?: (folderPath: string) => Promise<boolean>;
      openFile?: (filePath: string) => Promise<boolean>;
      deleteFiles?: (filePaths: string[]) => Promise<{ success: boolean; count: number; total: number; errors?: any[] }>;
      cancelScanNative?: () => Promise<boolean>;
      onScanProgress?: (callback: (progress: ScanProgress) => void) => () => void;
      onScanItem?: (callback: (file: ElectronScannedFile) => void) => () => void;
      onScanItemsBatch?: (callback: (files: ElectronScannedFile[]) => void) => () => void;
    };
  }
}
