const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: `WinMedia Scanner v${app.getVersion() || '1.0.4'} - Windows Native Media Cataloger`,
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Robust resolution for packaged app, asar, or unpacked directory
    const candidates = [
      path.join(__dirname, '../dist/index.html'),
      path.join(app.getAppPath(), 'dist/index.html'),
      path.join(process.resourcesPath, 'app/dist/index.html'),
      path.join(process.resourcesPath, 'app.asar/dist/index.html')
    ];

    let loaded = false;
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        mainWindow.loadFile(candidate);
        loaded = true;
        break;
      }
    }
    if (!loaded) {
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
  }

  // Press F12 to toggle DevTools if needed
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler: Native Windows Folder Selection Dialog
ipcMain.handle('select-folder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Windows Media Folder to Scan',
    buttonLabel: 'Scan Folder',
    properties: ['openDirectory', 'dontAddToRecent']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

// IPC Handler: Open Folder in Native Windows Explorer
ipcMain.handle('open-folder', async (event, folderPath) => {
  if (!folderPath) return false;
  try {
    const err = await shell.openPath(folderPath);
    if (err) {
      console.warn('shell.openPath error:', err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to open folder:', err);
    return false;
  }
});

// IPC Handler: Open File in Default System Application
ipcMain.handle('open-file', async (event, filePath) => {
  if (!filePath) return false;
  try {
    const err = await shell.openPath(filePath);
    if (err) {
      console.warn('shell.openPath file error:', err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to open file:', err);
    return false;
  }
});

// IPC Handler: Delete file(s) safely to Recycle Bin via shell.trashItem or fs.unlink
ipcMain.handle('delete-files', async (event, filePaths) => {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return { success: false, count: 0 };
  }
  let successCount = 0;
  const errors = [];

  for (const fp of filePaths) {
    if (!fp) continue;
    try {
      if (shell.trashItem) {
        await shell.trashItem(fp);
        successCount++;
      } else {
        await fs.promises.unlink(fp);
        successCount++;
      }
    } catch (err) {
      console.error(`Failed to delete file ${fp}:`, err);
      errors.push({ path: fp, error: err.message });
    }
  }

  return { success: successCount > 0, count: successCount, total: filePaths.length, errors };
});

// Media extension sets for native scanning
const VIDEO_EXTS = new Set(['mkv', 'mp4', 'm4v', 'avi', 'mov', 'wmv', 'flv', 'webm', 'ts', 'm2ts', 'vob', 'mpg', 'mpeg', 'divx']);
const AUDIO_EXTS = new Set(['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'alac', 'aiff', 'ac3', 'eac3', 'dts']);
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'heic', 'avif', 'dng', 'cr2', 'raw']);

function inspectImageDimensionsFromBuffer(bytes) {
  if (!bytes || bytes.length < 10) return undefined;
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    if (bytes.length >= 24) {
      const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      if (width > 0 && height > 0) return { width, height };
    }
  }
  // GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    if (bytes.length >= 10) {
      const width = bytes[6] | (bytes[7] << 8);
      const height = bytes[8] | (bytes[9] << 8);
      if (width > 0 && height > 0) return { width, height };
    }
  }
  // BMP
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    if (bytes.length >= 26) {
      const width = Math.abs(bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24));
      const height = Math.abs(bytes[22] | (bytes[23] << 8) | (bytes[24] << 16) | (bytes[25] << 24));
      if (width > 0 && height > 0) return { width, height };
    }
  }
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length - 8) {
      if (bytes[offset] !== 0xff) { offset++; continue; }
      const marker = bytes[offset + 1];
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        if (width > 0 && height > 0) return { width, height };
      }
      const blockLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 2 + blockLength;
    }
  }
  return undefined;
}

function inspectVideoDimensionsFromBuffer(bytes) {
  if (!bytes || bytes.length < 32) return undefined;

  const str = bytes.toString ? bytes.toString('latin1') : new TextDecoder('latin1').decode(bytes);
  for (const tag of ['avc1', 'hvc1', 'mp4v', 'vp09', 'av01']) {
    let idx = str.indexOf(tag);
    while (idx !== -1 && idx + 28 < bytes.length) {
      const w = (bytes[idx + 24] << 8) | bytes[idx + 25];
      const h = (bytes[idx + 26] << 8) | bytes[idx + 27];
      if (w >= 160 && w <= 8192 && h >= 120 && h <= 4320) {
        return { width: w, height: h };
      }
      idx = str.indexOf(tag, idx + 4);
    }
  }

  const strfIdx = str.indexOf('strf');
  if (strfIdx !== -1 && strfIdx + 20 < bytes.length) {
    const w = bytes[strfIdx + 12] | (bytes[strfIdx + 13] << 8) | (bytes[strfIdx + 14] << 16) | (bytes[strfIdx + 15] << 24);
    const h = Math.abs(bytes[strfIdx + 16] | (bytes[strfIdx + 17] << 8) | (bytes[strfIdx + 18] << 16) | (bytes[strfIdx + 19] << 24));
    if (w >= 160 && w <= 8192 && h >= 120 && h <= 4320) {
      return { width: w, height: h };
    }
  }

  return undefined;
}

// Resolution extraction for native scan
function extractResolution(fileName, codecDetails, type, dimensions) {
  if (type === 'audio') return '—';

  // For Image files: render Vertical x Horizontal pixel count (Height × Width)
  if (type === 'image') {
    if (dimensions && dimensions.width && dimensions.height) {
      return `${dimensions.height} × ${dimensions.width}`;
    }
    const textToScan = `${fileName} ${codecDetails || ''}`;
    const dimMatch = textToScan.match(/(\d{2,5})\s*[x×]\s*(\d{2,5})/i);
    if (dimMatch) {
      const d1 = parseInt(dimMatch[1], 10);
      const d2 = parseInt(dimMatch[2], 10);
      return `${d2} × ${d1}`;
    }
    return '1080 × 1920';
  }

  // Video files
  if (dimensions && dimensions.width && dimensions.height) {
    const { width, height } = dimensions;
    if (width >= 3800 || height >= 2000) return '4K (2160p)';
    if (width >= 2400 || height >= 1350) return '1440p (2K)';
    if (width >= 1800 || height >= 800) return '1080p (FHD)';
    if (width >= 1150 || height >= 650) return '720p (HD)';
    if (height >= 500) return '576p (PAL)';
    if (height >= 350) return '480p (SD)';
    return `${width}×${height}`;
  }

  const textToScan = `${fileName} ${codecDetails || ''}`;
  const lower = textToScan.toLowerCase();

  if (/(?:[._\-\s\[(]|^)(4320p|8k|uhd[\.\-_]?2)(?:[._\-\s\])]|$)/i.test(lower)) return '8K (4320p)';
  if (/(?:[._\-\s\[(]|^)(2160p|4k|uhd)(?:[._\-\s\])]|$)/i.test(lower)) return '4K (2160p)';
  if (/(?:[._\-\s\[(]|^)(1440p|2k|qhd|wqhd)(?:[._\-\s\])]|$)/i.test(lower)) return '1440p (2K)';
  if (/(?:[._\-\s\[(]|^)(1080p|1080i|fhd|full[\._\-\s]?hd|1920x1080)(?:[._\-\s\])]|$)/i.test(lower)) return '1080p (FHD)';
  if (/(?:[._\-\s\[(]|^)(720p|720i|1280x720)(?:[._\-\s\])]|$)/i.test(lower)) return '720p (HD)';
  if (/(?:[._\-\s\[(]|^)(576p|576i)(?:[._\-\s\])]|$)/i.test(lower)) return '576p (PAL)';
  if (/(?:[._\-\s\[(]|^)(480p|480i|sd)(?:[._\-\s\])]|$)/i.test(lower)) return '480p (SD)';

  if (/(?:[._\-\s\[(]|^)(bluray|bdrip|remux|web[\._\-]?dl|webrip|hdtv)(?:[._\-\s\])]|$)/i.test(lower)) {
    return '1080p (FHD)';
  }
  if (/(?:[._\-\s\[(]|^)(dvdrip|dvd|vob|xvid)(?:[._\-\s\])]|$)/i.test(lower)) {
    return '480p (SD)';
  }

  const dimMatch = textToScan.match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/i);
  if (dimMatch) {
    const w = parseInt(dimMatch[1], 10);
    const h = parseInt(dimMatch[2], 10);
    if (w >= 3800 || h >= 2000) return '4K (2160p)';
    if (w >= 2400 || h >= 1350) return '1440p (2K)';
    if (w >= 1800 || h >= 800) return '1080p (FHD)';
    if (w >= 1150 || h >= 650) return '720p (HD)';
    if (h >= 350) return '480p (SD)';
    return `${w}×${h}`;
  }

  if (type === 'video') return '1080p (FHD)';
  return '—';
}

// Fast binary header inspection + filename heuristic detector for native desktop scanner
async function detectMediaCodecs(fullPath, ext, fileName, size) {
  const lowerName = fileName.toLowerCase();
  let nameHintVideo = null;
  let nameHintAudio = null;

  // Filename heuristics for video codec - H.265 / HEVC checked first with high priority
  if (/(?:[._\-\s\[(]|^)(h[\.\-_]?265|x[\.\-_]?265|hevc|265)(?:[._\-\s\])]|$)/i.test(lowerName)) {
    nameHintVideo = 'H.265 / HEVC';
  } else if (/(?:[._\-\s\[(]|^)(h[\.\-_]?264|x[\.\-_]?264|avc|264)(?:[._\-\s\])]|$)/i.test(lowerName)) {
    nameHintVideo = 'H.264 / AVC';
  } else if (/(?:[._\-\s\[(]|^)(av1|av01)(?:[._\-\s\])]|$)/i.test(lowerName)) {
    nameHintVideo = 'AV1 (AOMedia Video 1)';
  } else if (/(?:[._\-\s\[(]|^)(vp9)(?:[._\-\s\])]|$)/i.test(lowerName)) {
    nameHintVideo = 'VP9';
  } else if (/(?:[._\-\s\[(]|^)(prores)(?:[._\-\s\])]|$)/i.test(lowerName)) {
    nameHintVideo = 'Apple ProRes';
  }

  // Filename heuristics for audio codec
  if (/(?:[._\-\s\[(]|^)(truehd|atmos)(?:[._\-\s\])]|$)/i.test(lowerName)) {
    nameHintAudio = 'Dolby TrueHD Atmos';
  } else if (/(?:[._\-\s\[(]|^)(dts[\.\-_]?hd|dts)(?:[._\-\s\])]|$)/i.test(lowerName)) {
    nameHintAudio = 'DTS-HD Master Audio';
  } else if (/(?:[._\-\s\[(]|^)(eac3|ddp|dd\+|dolby[\.\-_]?digital[\.\-_]?plus)(?:[._\-\s\])]|$)/i.test(lowerName)) {
    nameHintAudio = 'Dolby Digital Plus (E-AC-3)';
  } else if (/(?:[._\-\s\[(]|^)(ac3|dd5\.1|dolby[\.\-_]?digital)(?:[._\-\s\])]|$)/i.test(lowerName)) {
    nameHintAudio = 'Dolby Digital (AC-3)';
  } else if (/(?:[._\-\s\[(]|^)(flac)(?:[._\-\s\])]|$)/i.test(lowerName)) {
    nameHintAudio = 'FLAC Lossless';
  }

  if (size === 0) {
    return {
      codec: nameHintVideo || `${ext.toUpperCase()} Stream`,
      audioCodec: nameHintAudio
    };
  }

  // Inspect up to 256 KB of the file header
  let headerText = '';
  let headBuf = null;
  try {
    const readLen = Math.min(size, 262144);
    const fd = await fs.promises.open(fullPath, 'r');
    headBuf = Buffer.alloc(readLen);
    await fd.read(headBuf, 0, readLen, 0);

    // If MP4/MOV/MKV and large file, also inspect tail up to 512KB where moov atom lives
    let tailBuf = null;
    if ((ext === 'mp4' || ext === 'm4v' || ext === 'mov' || ext === 'mkv') && size > 262144) {
      const tailLen = Math.min(size - 262144, 524288);
      tailBuf = Buffer.alloc(tailLen);
      await fd.read(tailBuf, 0, tailLen, size - tailLen);
    }
    await fd.close();

    headerText = headBuf.toString('latin1');
    if (tailBuf) {
      headerText += ' ' + tailBuf.toString('latin1');
    }
  } catch {
    return {
      codec: nameHintVideo || `${ext.toUpperCase()} Stream`,
      audioCodec: nameHintAudio
    };
  }

  const headerLower = headerText.toLowerCase();
  let videoCodec = null;
  let audioCodec = null;

  // MKV / Matroska
  if (ext === 'mkv' || ext === 'mka' || ext === 'webm' || (headBuf && headBuf[0] === 0x1A && headBuf[1] === 0x45 && headBuf[2] === 0xDF && headBuf[3] === 0xA3)) {
    const isHevc = 
      headerText.includes('V_MPEGH/ISO/HEVC') ||
      headerText.includes('V_MPEGH') ||
      headerText.includes('V_MPEG4/ISO/HEVC') ||
      headerText.includes('V_HEVC') ||
      headerText.includes('V_H265') ||
      headerText.includes('hev1') ||
      headerText.includes('hvc1') ||
      headerText.includes('hvcC') ||
      headerText.includes('dvh1') ||
      headerText.includes('dvhe') ||
      headerText.includes('HEVC') ||
      headerLower.includes('hevc') ||
      headerText.includes('H265') ||
      headerLower.includes('h265') ||
      headerLower.includes('x265') ||
      headerLower.includes('h.265') ||
      nameHintVideo === 'H.265 / HEVC';

    const isAvc = 
      !isHevc && (
        headerText.includes('V_MPEG4/ISO/AVC') ||
        headerText.includes('V_AVC') ||
        headerText.includes('avc1') ||
        headerText.includes('avc3') ||
        headerText.includes('avcC') ||
        headerText.includes('dva1') ||
        headerText.includes('dvav') ||
        headerText.includes('H264') ||
        headerLower.includes('h264') ||
        headerLower.includes('x264') ||
        headerLower.includes('h.264') ||
        nameHintVideo === 'H.264 / AVC'
      );

    if (isHevc) {
      videoCodec = 'H.265 / HEVC';
    } else if (isAvc) {
      videoCodec = 'H.264 / AVC';
    } else if (headerText.includes('V_AV1') || headerText.includes('av01') || headerLower.includes('av01') || nameHintVideo === 'AV1 (AOMedia Video 1)') {
      videoCodec = 'AV1 (AOMedia Video 1)';
    } else if (headerText.includes('V_VP9') || headerText.includes('vp09') || headerLower.includes('vp09') || nameHintVideo === 'VP9') {
      videoCodec = 'VP9';
    } else if (headerText.includes('V_VP8') || headerLower.includes('vp08')) {
      videoCodec = 'VP8';
    } else if (headerText.includes('V_PRORES') || headerLower.includes('prores') || nameHintVideo === 'Apple ProRes') {
      videoCodec = 'Apple ProRes';
    } else if (ext === 'webm') {
      videoCodec = 'VP9 / AV1 (WebM)';
    } else {
      videoCodec = nameHintVideo || 'Matroska Video (MKV)';
    }

    if (headerText.includes('A_TRUEHD')) audioCodec = 'Dolby TrueHD Atmos';
    else if (headerText.includes('A_DTS/LOSSLESS') || headerText.includes('A_DTS')) audioCodec = 'DTS-HD Master Audio';
    else if (headerText.includes('A_EAC3')) audioCodec = 'Dolby Digital Plus (E-AC-3)';
    else if (headerText.includes('A_AC3')) audioCodec = 'Dolby Digital (AC-3 5.1)';
    else if (headerText.includes('A_AAC')) audioCodec = 'AAC-LC';
    else if (headerText.includes('A_FLAC')) audioCodec = 'FLAC Lossless';
    else if (headerText.includes('A_OPUS')) audioCodec = 'Opus Audio';
    else if (headerText.includes('A_VORBIS')) audioCodec = 'Vorbis';
    else audioCodec = nameHintAudio;
  }
  // MP4 / MOV / M4V
  else if (ext === 'mp4' || ext === 'm4v' || ext === 'mov') {
    const isHevc = 
      headerText.includes('hvc1') ||
      headerText.includes('hev1') ||
      headerText.includes('hvcC') ||
      headerText.includes('dvh1') ||
      headerText.includes('dvhe') ||
      headerText.includes('HEVC') ||
      headerLower.includes('hevc') ||
      headerText.includes('H265') ||
      headerLower.includes('h265') ||
      headerLower.includes('x265') ||
      headerLower.includes('h.265') ||
      nameHintVideo === 'H.265 / HEVC';

    const isAvc = 
      !isHevc && (
        headerText.includes('avc1') ||
        headerText.includes('avc3') ||
        headerText.includes('avcC') ||
        headerText.includes('dva1') ||
        headerText.includes('dvav') ||
        headerText.includes('H264') ||
        headerLower.includes('h264') ||
        headerLower.includes('x264') ||
        headerLower.includes('h.264') ||
        nameHintVideo === 'H.264 / AVC'
      );

    if (isHevc) {
      videoCodec = 'H.265 / HEVC';
    } else if (isAvc) {
      videoCodec = 'H.264 / AVC';
    } else if (headerText.includes('av01') || headerText.includes('av1C') || headerLower.includes('av01') || nameHintVideo === 'AV1 (AOMedia Video 1)') {
      videoCodec = 'AV1 (AOMedia Video 1)';
    } else if (headerText.includes('vp09') || headerText.includes('vpcC') || headerLower.includes('vp09') || nameHintVideo === 'VP9') {
      videoCodec = 'VP9';
    } else if (headerText.includes('apcn') || headerText.includes('apch') || headerText.includes('apco') || headerText.includes('apcs') || nameHintVideo === 'Apple ProRes') {
      videoCodec = 'Apple ProRes';
    } else {
      videoCodec = nameHintVideo || 'MPEG-4 Video (MP4)';
    }

    if (headerText.includes('mp4a')) audioCodec = 'AAC-LC';
    else if (headerText.includes('ec-3')) audioCodec = 'Dolby Digital Plus (E-AC-3)';
    else if (headerText.includes('ac-3')) audioCodec = 'Dolby Digital (AC-3)';
    else if (headerText.includes('alac')) audioCodec = 'Apple Lossless (ALAC)';
    else if (headerText.includes('Opus')) audioCodec = 'Opus';
    else if (headerText.includes('flac')) audioCodec = 'FLAC';
    else audioCodec = nameHintAudio;
  }
  // AVI
  else if (ext === 'avi') {
    if (headerText.includes('H264') || headerText.includes('h264') || headerText.includes('AVC1') || headerText.includes('avc1') || nameHintVideo === 'H.264 / AVC') {
      videoCodec = 'H.264 / AVC (AVI)';
    } else if (headerText.includes('XVID') || headerText.includes('xvid')) {
      videoCodec = 'XviD (MPEG-4 ASP)';
    } else if (headerText.includes('DIVX') || headerText.includes('divx') || headerText.includes('DX50')) {
      videoCodec = 'DivX (MPEG-4)';
    } else if (headerText.includes('HEVC') || headerText.includes('H265') || nameHintVideo === 'H.265 / HEVC') {
      videoCodec = 'H.265 / HEVC';
    } else {
      videoCodec = nameHintVideo || 'AVI MPEG-4';
    }
    audioCodec = headerText.includes('ac-3') ? 'AC-3 (Dolby)' : 'MP3 Stereo';
  }
  // Audio
  else if (ext === 'mp3') {
    videoCodec = 'MPEG-1 Layer 3 (MP3)';
    audioCodec = 'MP3 Audio';
  } else if (ext === 'flac') {
    videoCodec = 'FLAC (Free Lossless Audio)';
    audioCodec = 'FLAC Lossless';
  } else if (ext === 'wav') {
    videoCodec = 'PCM (Linear Uncompressed)';
    audioCodec = 'WAV PCM';
  } else if (ext === 'aac') {
    videoCodec = 'AAC (Advanced Audio Coding)';
    audioCodec = 'AAC';
  } else if (ext === 'ogg' || ext === 'opus') {
    if (headerText.includes('OpusHead') || ext === 'opus') {
      videoCodec = 'Opus Interactive Audio';
      audioCodec = 'Opus';
    } else {
      videoCodec = 'Ogg Vorbis';
      audioCodec = 'Vorbis';
    }
  } else if (ext === 'jpg' || ext === 'jpeg') {
    videoCodec = 'JPEG / JFIF';
  } else if (ext === 'png') {
    videoCodec = 'PNG (Deflate)';
  } else if (ext === 'webp') {
    videoCodec = 'WebP (VP8 / Lossless)';
  } else if (ext === 'gif') {
    videoCodec = 'GIF';
  }

  let mediaDims = undefined;
  if (headBuf) {
    if (IMAGE_EXTS.has(ext)) {
      mediaDims = inspectImageDimensionsFromBuffer(headBuf);
    } else if (VIDEO_EXTS.has(ext)) {
      mediaDims = inspectVideoDimensionsFromBuffer(headBuf);
      if (!mediaDims && typeof tailBuf !== 'undefined' && tailBuf) {
        mediaDims = inspectVideoDimensionsFromBuffer(tailBuf);
      }
    }
  }

  return {
    codec: videoCodec || nameHintVideo || `${ext.toUpperCase()} Stream`,
    audioCodec: audioCodec || nameHintAudio,
    dimensions: mediaDims
  };
}

let currentScanId = 0;
let cancelScanRequested = false;

ipcMain.handle('cancel-scan-native', () => {
  cancelScanRequested = true;
  currentScanId++; // Immediately invalidate any in-flight or queued scan operations
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
    try {
      mainWindow.webContents.send('scan-progress', {
        isScanning: false,
        currentFolder: 'Scan stopped by user',
        scannedFilesCount: 0,
        mediaFilesCount: 0,
        totalBytes: 0,
        elapsedMs: 0
      });
    } catch {}
  }
  return true;
});

// IPC Handler: Direct, lightning-fast native Windows directory scanning with active live progress and deduplication
ipcMain.handle('scan-directory-native', async (event, rootDir) => {
  // Invalidate any previous scan that might still be traversing
  currentScanId++;
  const thisScanId = currentScanId;
  cancelScanRequested = false;

  const discoveredFiles = [];
  let scannedFilesCount = 0;
  let mediaFilesCount = 0;
  let totalBytes = 0;
  let lastProgressSent = 0;
  const startTime = Date.now();

  const broadcast = (channel, data) => {
    if (cancelScanRequested || thisScanId !== currentScanId) return;
    try {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send(channel, data);
      } else if (event && event.sender && !event.sender.isDestroyed()) {
        event.sender.send(channel, data);
      }
    } catch {}
  };

  const sendProgress = (currentDir, force = false) => {
    if (cancelScanRequested || thisScanId !== currentScanId) return;
    const now = Date.now();
    if (force || now - lastProgressSent > 60) {
      lastProgressSent = now;
      const winCurrent = (currentDir || rootDir).replace(/\//g, '\\');
      broadcast('scan-progress', {
        isScanning: true,
        currentFolder: winCurrent,
        scannedFilesCount,
        mediaFilesCount,
        totalBytes,
        elapsedMs: now - startTime
      });
    }
  };

  let pendingBatch = [];
  const flushBatch = () => {
    if (cancelScanRequested || thisScanId !== currentScanId) {
      pendingBatch = [];
      return;
    }
    if (pendingBatch.length > 0) {
      const chunk = pendingBatch.slice();
      pendingBatch = [];
      broadcast('scan-items-batch', chunk);
    }
  };

  const visitedDirs = new Set();
  const visitedFiles = new Set();
  const visitedInodes = new Set();

  async function traverse(currentDir) {
    if (cancelScanRequested || thisScanId !== currentScanId) return;

    // Canonical directory path normalization & symlink/junction loop prevention
    let realDir = currentDir;
    try {
      realDir = await fs.promises.realpath(currentDir);
    } catch {
      realDir = currentDir;
    }
    const cleanRealDir = realDir.replace(/^\\\\\?\\/, '').replace(/\//g, '\\').toLowerCase();
    if (visitedDirs.has(cleanRealDir)) return;
    visitedDirs.add(cleanRealDir);

    let entries;
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    if (cancelScanRequested || thisScanId !== currentScanId) return;
    sendProgress(currentDir);

    for (let i = 0; i < entries.length; i++) {
      if (cancelScanRequested || thisScanId !== currentScanId) break;
      const entry = entries[i];
      const fullPath = path.join(currentDir, entry.name);

      // Skip symbolic links & directory junctions to prevent loops and duplicate file entries
      if (typeof entry.isSymbolicLink === 'function' && entry.isSymbolicLink()) {
        continue;
      }

      if (entry.isDirectory()) {
        await traverse(fullPath);
        if (cancelScanRequested || thisScanId !== currentScanId) break;
      } else if (entry.isFile()) {
        if (cancelScanRequested || thisScanId !== currentScanId) break;
        scannedFilesCount++;
        const ext = path.extname(entry.name).toLowerCase().replace(/^\./, '');
        const isVideo = VIDEO_EXTS.has(ext);
        const isAudio = AUDIO_EXTS.has(ext);
        const isImage = IMAGE_EXTS.has(ext);

        if (isVideo || isAudio || isImage) {
          const winFullPath = fullPath.replace(/\//g, '\\');
          const normalizedPathKey = winFullPath.replace(/^\\\\\?\\/, '').toLowerCase();

          // Deduplicate by path string
          if (visitedFiles.has(normalizedPathKey)) {
            continue;
          }
          visitedFiles.add(normalizedPathKey);

          try {
            const stats = await fs.promises.stat(fullPath);

            // Deduplicate by device & inode (NTFS file index) to prevent hardlink/alias duplication
            if (stats.dev && stats.ino) {
              const inodeKey = `${stats.dev}:${stats.ino}`;
              if (visitedInodes.has(inodeKey)) {
                continue;
              }
              visitedInodes.add(inodeKey);
            }

            totalBytes += stats.size;
            mediaFilesCount++;

            const winFolder = currentDir.replace(/\//g, '\\');
            const codecInfo = await detectMediaCodecs(fullPath, ext, entry.name, stats.size);
            const res = extractResolution(entry.name, codecInfo.codec, isVideo ? 'video' : isAudio ? 'audio' : 'image', codecInfo.dimensions);

            const item = {
              name: entry.name,
              folder: winFolder,
              fullPath: winFullPath,
              extension: ext,
              resolution: res,
              size: stats.size,
              lastModified: stats.mtimeMs,
              type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
              codec: codecInfo.codec,
              audioCodec: codecInfo.audioCodec
            };

            discoveredFiles.push(item);
            pendingBatch.push(item);

            if (pendingBatch.length >= 25) {
              flushBatch();
            }

            sendProgress(currentDir);
          } catch {
            // Ignore unreadable files
          }
        } else if (scannedFilesCount % 20 === 0) {
          sendProgress(currentDir);
        }

        // Periodically yield to event loop so Electron main process and IPC stay completely responsive
        if (scannedFilesCount % 30 === 0) {
          flushBatch();
          await new Promise(resolve => setImmediate(resolve));
        }
      }
    }
  }

  // Initial immediate progress update
  sendProgress(rootDir, true);

  await traverse(rootDir);
  flushBatch();

  if (thisScanId !== currentScanId || cancelScanRequested) {
    return [];
  }

  // Final completion event
  broadcast('scan-progress', {
    isScanning: false,
    currentFolder: `Scan completed: ${mediaFilesCount} media found`,
    scannedFilesCount,
    mediaFilesCount,
    totalBytes,
    elapsedMs: Date.now() - startTime
  });

  return discoveredFiles;
});
