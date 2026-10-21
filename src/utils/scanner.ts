import { MediaItem, ScanProgress } from '../types/media.ts';
import { detectFileCodec, isMediaExtension, getMediaTypeFromExtension, extractResolution } from './codecDetector.ts';
import { formatBytes, formatDate, normalizeWindowsPath } from './formatters.ts';

export interface ScanOptions {
  mediaOnly: boolean;
  windowsDrivePrefix: string; // e.g. "C:\Users\John\Videos" or "D:\Media"
  onProgress?: (progress: ScanProgress) => void;
  onItemDiscovered?: (item: MediaItem) => void;
  shouldCancel?: () => boolean;
}

/**
 * Recursively scans a DirectoryHandle obtained from window.showDirectoryPicker()
 */
export async function scanDirectoryHandle(
  rootHandle: any, // FileSystemDirectoryHandle
  options: ScanOptions
): Promise<MediaItem[]> {
  const items: MediaItem[] = [];
  const seenPaths = new Set<string>();
  const startTime = Date.now();
  let scannedFilesCount = 0;
  let totalBytes = 0;

  const rootPrefix = options.windowsDrivePrefix.trim() 
    ? options.windowsDrivePrefix.trim().replace(/\\+$/, '') 
    : `C:\\${rootHandle.name}`;

  async function traverse(dirHandle: any, currentRelativePath: string) {
    if (options.shouldCancel?.()) return;

    const displayFolder = currentRelativePath 
      ? `${rootPrefix}\\${currentRelativePath}` 
      : rootPrefix;

    options.onProgress?.({
      isScanning: true,
      currentFolder: displayFolder,
      scannedFilesCount,
      mediaFilesCount: items.length,
      totalBytes,
      elapsedMs: Date.now() - startTime
    });

    const subDirs: any[] = [];
    const files: any[] = [];

    // Iterate through directory entries
    for await (const entry of dirHandle.values()) {
      if (options.shouldCancel?.()) return;
      if (entry.kind === 'directory') {
        subDirs.push(entry);
      } else if (entry.kind === 'file') {
        files.push(entry);
      }
    }

    // Process files in this directory
    for (const fileHandle of files) {
      if (options.shouldCancel?.()) return;
      scannedFilesCount++;

      const ext = fileHandle.name.split('.').pop()?.toLowerCase() || '';
      const isMedia = isMediaExtension(ext);

      if (options.mediaOnly && !isMedia) {
        continue;
      }

      try {
        const file: File = await fileHandle.getFile();
        totalBytes += file.size;

        const codecResult = await detectFileCodec(file);
        const folderPath = displayFolder;
        const fullPath = `${folderPath}\\${file.name}`;
        const pathKey = fullPath.replace(/\//g, '\\').toLowerCase();
        if (seenPaths.has(pathKey)) continue;
        seenPaths.add(pathKey);

        const item: MediaItem = {
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: file.name,
          folder: folderPath,
          fullPath,
          codec: codecResult.codec,
          codecDetails: codecResult.codecDetails,
          audioCodec: codecResult.audioCodec,
          extension: ext,
          resolution: extractResolution(file.name, codecResult.codecDetails, undefined, codecResult.type),
          size: file.size,
          sizeFormatted: formatBytes(file.size),
          type: codecResult.type,
          lastModified: file.lastModified,
          lastModifiedFormatted: formatDate(file.lastModified),
          fileRef: file,
          handle: fileHandle
        };

        items.push(item);
        options.onItemDiscovered?.(item);

        // Notify progress live on every discovered media file
        options.onProgress?.({
          isScanning: true,
          currentFolder: displayFolder,
          scannedFilesCount,
          mediaFilesCount: items.length,
          totalBytes,
          elapsedMs: Date.now() - startTime
        });
      } catch (err) {
        console.warn(`Could not read file ${fileHandle.name}:`, err);
      }
    }

    // Recurse into subdirectories
    for (const subDir of subDirs) {
      if (options.shouldCancel?.()) return;
      const nextRelative = currentRelativePath 
        ? `${currentRelativePath}\\${subDir.name}` 
        : subDir.name;
      await traverse(subDir, nextRelative);
      if (options.shouldCancel?.()) return;
    }
  }

  await traverse(rootHandle, '');

  options.onProgress?.({
    isScanning: false,
    currentFolder: options.shouldCancel?.() ? 'Scan stopped by user' : 'Scan completed',
    scannedFilesCount,
    mediaFilesCount: items.length,
    totalBytes,
    elapsedMs: Date.now() - startTime
  });

  return items;
}

/**
 * Recursively scans FileList from <input type="file" webkitdirectory>
 */
export async function scanFileList(
  fileList: FileList,
  options: ScanOptions
): Promise<MediaItem[]> {
  const items: MediaItem[] = [];
  const seenPaths = new Set<string>();
  const startTime = Date.now();
  let scannedFilesCount = 0;
  let totalBytes = 0;

  const filesArray = Array.from(fileList);
  const firstFilePath = filesArray[0]?.webkitRelativePath || '';
  const inferredRoot = firstFilePath.split('/')[0] || 'SelectedFolder';
  
  const rootPrefix = options.windowsDrivePrefix.trim() 
    ? options.windowsDrivePrefix.trim().replace(/\\+$/, '') 
    : `C:\\${inferredRoot}`;

  for (let i = 0; i < filesArray.length; i++) {
    if (options.shouldCancel?.()) break;

    const file = filesArray[i];
    scannedFilesCount++;
    totalBytes += file.size;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isMedia = isMediaExtension(ext);

    let folderPath = '';
    let fullPath = '';

    // If running in Electron or native desktop, file.path contains the real absolute Windows path
    const nativeFilePath = (file as any).path;
    if (nativeFilePath && typeof nativeFilePath === 'string') {
      fullPath = nativeFilePath.replace(/\//g, '\\');
      const lastSlashIndex = fullPath.lastIndexOf('\\');
      folderPath = lastSlashIndex !== -1 ? fullPath.substring(0, lastSlashIndex) : fullPath;
    } else {
      // Standard browser fallback using webkitRelativePath
      const relParts = file.webkitRelativePath.split('/');
      relParts.pop(); // remove filename
      if (relParts.length > 0 && relParts[0] === inferredRoot && !options.windowsDrivePrefix.trim()) {
        relParts.shift();
      }
      const subPath = relParts.join('\\');
      folderPath = subPath ? `${rootPrefix}\\${subPath}` : rootPrefix;
      fullPath = `${folderPath}\\${file.name}`;
    }

    if (options.mediaOnly && !isMedia) {
      continue;
    }

    const pathKey = fullPath.replace(/\//g, '\\').toLowerCase();
    if (seenPaths.has(pathKey)) {
      continue;
    }
    seenPaths.add(pathKey);

    const codecResult = await detectFileCodec(file);

    const item: MediaItem = {
      id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${i}`,
      name: file.name,
      folder: folderPath,
      fullPath,
      codec: codecResult.codec,
      codecDetails: codecResult.codecDetails,
      audioCodec: codecResult.audioCodec,
      extension: ext,
      resolution: extractResolution(file.name, codecResult.codecDetails, undefined, codecResult.type),
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      type: codecResult.type,
      lastModified: file.lastModified,
      lastModifiedFormatted: formatDate(file.lastModified),
      fileRef: file
    };

    items.push(item);
    options.onItemDiscovered?.(item);

    const percent = Math.min(100, Math.round(((i + 1) / filesArray.length) * 100));
    options.onProgress?.({
      isScanning: true,
      currentFolder: folderPath,
      scannedFilesCount,
      mediaFilesCount: items.length,
      totalBytes,
      elapsedMs: Date.now() - startTime,
      totalFilesToScan: filesArray.length,
      percent
    });
  }

  options.onProgress?.({
    isScanning: false,
    currentFolder: options.shouldCancel?.() ? 'Scan stopped by user' : `Scan completed: ${items.length} media found`,
    scannedFilesCount,
    mediaFilesCount: items.length,
    totalBytes,
    elapsedMs: Date.now() - startTime,
    totalFilesToScan: filesArray.length,
    percent: 100
  });

  return items;
}

/**
 * Recursively scans dragged and dropped folders using DataTransferItem entries
 */
export async function scanDroppedEntries(
  itemsList: DataTransferItemList,
  options: ScanOptions
): Promise<MediaItem[]> {
  const mediaItems: MediaItem[] = [];
  const seenPaths = new Set<string>();
  const startTime = Date.now();
  let scannedFilesCount = 0;
  let totalBytes = 0;

  const rootPrefix = options.windowsDrivePrefix.trim() 
    ? options.windowsDrivePrefix.trim().replace(/\\+$/, '') 
    : '';

  // Read all entries recursively
  async function readEntry(entry: any, relativeDir: string): Promise<void> {
    if (options.shouldCancel?.()) return;

    if (entry.isFile) {
      scannedFilesCount++;
      const file: File = await new Promise((resolve, reject) => entry.file(resolve, reject));
      totalBytes += file.size;

      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isMedia = isMediaExtension(ext);

      if (options.mediaOnly && !isMedia) {
        return;
      }

      let folderPath = '';
      let fullPath = '';

      const nativeFilePath = (file as any).path;
      if (nativeFilePath && typeof nativeFilePath === 'string') {
        fullPath = nativeFilePath.replace(/\//g, '\\');
        const lastSlashIndex = fullPath.lastIndexOf('\\');
        folderPath = lastSlashIndex !== -1 ? fullPath.substring(0, lastSlashIndex) : fullPath;
      } else {
        const baseFolder = rootPrefix || `C:\\${relativeDir.split('\\')[0] || 'Media'}`;
        folderPath = relativeDir ? `${baseFolder}\\${relativeDir}` : baseFolder;
        fullPath = `${folderPath}\\${file.name}`;
      }

      const pathKey = fullPath.replace(/\//g, '\\').toLowerCase();
      if (seenPaths.has(pathKey)) {
        return;
      }
      seenPaths.add(pathKey);

      const codecResult = await detectFileCodec(file);

      const item: MediaItem = {
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name: file.name,
        folder: folderPath,
        fullPath,
        codec: codecResult.codec,
        codecDetails: codecResult.codecDetails,
        audioCodec: codecResult.audioCodec,
        extension: ext,
        resolution: extractResolution(file.name, codecResult.codecDetails, undefined, codecResult.type),
        size: file.size,
        sizeFormatted: formatBytes(file.size),
        type: codecResult.type,
        lastModified: file.lastModified,
        lastModifiedFormatted: formatDate(file.lastModified),
        fileRef: file
      };

      mediaItems.push(item);
      options.onItemDiscovered?.(item);

      options.onProgress?.({
        isScanning: true,
        currentFolder: folderPath,
        scannedFilesCount,
        mediaFilesCount: mediaItems.length,
        totalBytes,
        elapsedMs: Date.now() - startTime
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const nextRel = relativeDir ? `${relativeDir}\\${entry.name}` : entry.name;
      
      const currentFolderDisplay = `${rootPrefix}\\${nextRel}`;
      options.onProgress?.({
        isScanning: true,
        currentFolder: currentFolderDisplay,
        scannedFilesCount,
        mediaFilesCount: mediaItems.length,
        totalBytes,
        elapsedMs: Date.now() - startTime
      });

      // readEntries reads in batches of 100
      const readAllDirectoryEntries = async (): Promise<any[]> => {
        const allEntries: any[] = [];
        let batch: any[] = [];
        do {
          batch = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
          allEntries.push(...batch);
        } while (batch.length > 0 && !options.shouldCancel?.());
        return allEntries;
      };

      const entries = await readAllDirectoryEntries();
      for (const childEntry of entries) {
        if (options.shouldCancel?.()) return;
        await readEntry(childEntry, nextRel);
      }
    }
  }

  for (let i = 0; i < itemsList.length; i++) {
    const item = itemsList[i];
    if (item.kind === 'file') {
      const entry = (item as any).webkitGetAsEntry?.();
      if (entry) {
        await readEntry(entry, '');
      }
    }
  }

  options.onProgress?.({
    isScanning: false,
    currentFolder: 'Scan completed',
    scannedFilesCount,
    mediaFilesCount: mediaItems.length,
    totalBytes,
    elapsedMs: Date.now() - startTime
  });

  return mediaItems;
}
