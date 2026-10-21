import { MediaType } from '../types/media.ts';

export interface CodecDetectionResult {
  codec: string;
  codecDetails?: string;
  audioCodec?: string;
  resolution?: string;
  type: MediaType;
}

// Media extensions categorized
export const VIDEO_EXTENSIONS = new Set([
  'mkv', 'mp4', 'm4v', 'avi', 'mov', 'wmv', 'flv', 'webm', 'ts', 'm2ts', 
  'vob', 'mpg', 'mpeg', '3gp', 'ogv', 'rm', 'rmvb', 'asf', 'divx', 'mxf'
]);

export const AUDIO_EXTENSIONS = new Set([
  'mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'alac', 'aiff', 
  'aif', 'ape', 'mid', 'midi', 'pcm', 'ac3', 'eac3', 'dts', 'dsd', 'mka'
]);

export const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico', 
  'heic', 'heif', 'avif', 'raw', 'cr2', 'nef', 'arw', 'dng', 'psd'
]);

export function getMediaTypeFromExtension(ext: string): MediaType {
  const cleanExt = ext.toLowerCase().replace(/^\./, '');
  if (VIDEO_EXTENSIONS.has(cleanExt)) return 'video';
  if (AUDIO_EXTENSIONS.has(cleanExt)) return 'audio';
  if (IMAGE_EXTENSIONS.has(cleanExt)) return 'image';
  return 'other';
}

export function isMediaExtension(ext: string): boolean {
  const cleanExt = ext.toLowerCase().replace(/^\./, '');
  return VIDEO_EXTENSIONS.has(cleanExt) || AUDIO_EXTENSIONS.has(cleanExt) || IMAGE_EXTENSIONS.has(cleanExt);
}

// Clean extension fallbacks that never falsely assume H.264
export const EXTENSION_DEFAULT_CODEC: Record<string, { codec: string; audioCodec?: string; type: MediaType }> = {
  // Video
  mkv: { codec: 'Matroska Video (MKV)', audioCodec: 'Multi-channel Audio', type: 'video' },
  mp4: { codec: 'MPEG-4 Video (MP4)', audioCodec: 'AAC Audio', type: 'video' },
  m4v: { codec: 'MPEG-4 Video (M4V)', audioCodec: 'AAC Audio', type: 'video' },
  mov: { codec: 'QuickTime Video (MOV)', audioCodec: 'AAC / LPCM', type: 'video' },
  avi: { codec: 'AVI (MPEG-4 / Audio Video Interleave)', audioCodec: 'MP3 / AC-3', type: 'video' },
  wmv: { codec: 'Windows Media Video (VC-1)', audioCodec: 'WMA', type: 'video' },
  flv: { codec: 'Flash Video (FLV)', audioCodec: 'MP3 / AAC', type: 'video' },
  webm: { codec: 'VP9 / AV1 (WebM)', audioCodec: 'Opus', type: 'video' },
  ts: { codec: 'MPEG-2 Transport Stream', audioCodec: 'AC-3', type: 'video' },
  m2ts: { codec: 'BDAV MPEG-2 Transport Stream', audioCodec: 'DTS / TrueHD', type: 'video' },
  vob: { codec: 'MPEG-2 Video (DVD VOB)', audioCodec: 'AC-3 (Dolby)', type: 'video' },
  mpg: { codec: 'MPEG-1 / MPEG-2 Video', audioCodec: 'MP2 Audio', type: 'video' },
  mpeg: { codec: 'MPEG-2 Video', audioCodec: 'MP2 Audio', type: 'video' },
  
  // Audio
  mp3: { codec: 'MPEG-1 Layer 3 (MP3)', audioCodec: 'MP3 Audio', type: 'audio' },
  flac: { codec: 'FLAC (Free Lossless Audio)', audioCodec: 'FLAC Lossless', type: 'audio' },
  wav: { codec: 'PCM (Linear Uncompressed)', audioCodec: 'WAV PCM', type: 'audio' },
  aac: { codec: 'AAC (Advanced Audio Coding)', audioCodec: 'AAC', type: 'audio' },
  ogg: { codec: 'Vorbis / Opus (Ogg)', audioCodec: 'Ogg Stream', type: 'audio' },
  opus: { codec: 'Opus Interactive Audio', audioCodec: 'Opus', type: 'audio' },
  m4a: { codec: 'AAC-LC / ALAC', audioCodec: 'AAC Audio', type: 'audio' },
  wma: { codec: 'Windows Media Audio (WMA)', audioCodec: 'WMA', type: 'audio' },
  alac: { codec: 'Apple Lossless (ALAC)', audioCodec: 'ALAC', type: 'audio' },
  aiff: { codec: 'Audio Interchange (AIFF PCM)', audioCodec: 'AIFF PCM', type: 'audio' },
  ac3: { codec: 'Dolby Digital (AC-3)', audioCodec: 'AC-3 5.1', type: 'audio' },
  eac3: { codec: 'Dolby Digital Plus (E-AC-3)', audioCodec: 'E-AC-3 7.1', type: 'audio' },
  dts: { codec: 'DTS Digital Surround', audioCodec: 'DTS Audio', type: 'audio' },

  // Images
  jpg: { codec: 'JPEG / JFIF', type: 'image' },
  jpeg: { codec: 'JPEG / JFIF', type: 'image' },
  png: { codec: 'PNG (Deflate/Portable Network Graphics)', type: 'image' },
  gif: { codec: 'GIF (Graphics Interchange Format)', type: 'image' },
  webp: { codec: 'WebP (VP8 / Lossless)', type: 'image' },
  avif: { codec: 'AVIF (AV1 Image File Format)', type: 'image' },
  heic: { codec: 'HEIC (High Efficiency Image Container)', type: 'image' },
  svg: { codec: 'SVG (Scalable Vector Graphics XML)', type: 'image' },
  bmp: { codec: 'Windows Bitmap (BMP)', type: 'image' },
  tiff: { codec: 'TIFF (Tagged Image File Format)', type: 'image' },
  raw: { codec: 'Digital Camera RAW', type: 'image' },
  dng: { codec: 'Adobe Digital Negative (DNG)', type: 'image' }
};

export function extractFilenameHints(filename: string): { videoCodec?: string; audioCodec?: string } {
  const lower = filename.toLowerCase();
  let videoCodec: string | undefined = undefined;
  let audioCodec: string | undefined = undefined;

  // Video Codec Patterns in Filename - H.265 / HEVC checked first with high precedence
  if (/(?:[._\-\s\[(]|^)(h[\.\-_]?265|x[\.\-_]?265|hevc|265)(?:[._\-\s\])]|$)/i.test(lower)) {
    videoCodec = 'H.265 / HEVC';
  } else if (/(?:[._\-\s\[(]|^)(h[\.\-_]?264|x[\.\-_]?264|avc|264)(?:[._\-\s\])]|$)/i.test(lower)) {
    videoCodec = 'H.264 / AVC';
  } else if (/(?:[._\-\s\[(]|^)(av1|av01)(?:[._\-\s\])]|$)/i.test(lower)) {
    videoCodec = 'AV1 (AOMedia Video 1)';
  } else if (/(?:[._\-\s\[(]|^)(vp9)(?:[._\-\s\])]|$)/i.test(lower)) {
    videoCodec = 'VP9';
  } else if (/(?:[._\-\s\[(]|^)(prores)(?:[._\-\s\])]|$)/i.test(lower)) {
    videoCodec = 'Apple ProRes';
  }

  // Audio Codec Patterns in Filename
  if (/(?:[._\-\s\[(]|^)(truehd|atmos)(?:[._\-\s\])]|$)/i.test(lower)) {
    audioCodec = 'Dolby TrueHD Atmos';
  } else if (/(?:[._\-\s\[(]|^)(dts[\.\-_]?hd|dts)(?:[._\-\s\])]|$)/i.test(lower)) {
    audioCodec = 'DTS-HD Master Audio';
  } else if (/(?:[._\-\s\[(]|^)(eac3|ddp|dd\+|dolby[\.\-_]?digital[\.\-_]?plus)(?:[._\-\s\])]|$)/i.test(lower)) {
    audioCodec = 'Dolby Digital Plus (E-AC-3)';
  } else if (/(?:[._\-\s\[(]|^)(ac3|dd5\.1|dolby[\.\-_]?digital)(?:[._\-\s\])]|$)/i.test(lower)) {
    audioCodec = 'Dolby Digital (AC-3)';
  } else if (/(?:[._\-\s\[(]|^)(flac)(?:[._\-\s\])]|$)/i.test(lower)) {
    audioCodec = 'FLAC Lossless';
  }

  return { videoCodec, audioCodec };
}

export async function detectFileCodec(file: File): Promise<CodecDetectionResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const type = getMediaTypeFromExtension(ext);
  const nameHints = extractFilenameHints(file.name);

  const fallback: CodecDetectionResult = {
    codec: nameHints.videoCodec || EXTENSION_DEFAULT_CODEC[ext]?.codec || (ext ? `${ext.toUpperCase()} Stream` : 'Unknown Media'),
    audioCodec: nameHints.audioCodec || EXTENSION_DEFAULT_CODEC[ext]?.audioCodec,
    type
  };

  try {
    // Read up to first 256KB of the file for binary header inspection
    const headSize = Math.min(file.size, 262144);
    if (headSize < 16) {
      return fallback;
    }

    const headBuffer = await file.slice(0, headSize).arrayBuffer();
    const headBytes = new Uint8Array(headBuffer);
    let textSample = new TextDecoder('latin1').decode(headBytes);

    // If Image file, inspect exact pixel dimensions
    if (type === 'image') {
      const imgDims = inspectImageDimensionsFromBuffer(headBytes);
      let imgRes = imgDims ? `${imgDims.height} × ${imgDims.width}` : undefined;
      if (!imgRes && typeof createImageBitmap !== 'undefined') {
        try {
          const bitmap = await createImageBitmap(file);
          imgRes = `${bitmap.height} × ${bitmap.width}`;
          bitmap.close();
        } catch {}
      }
      return {
        codec: EXTENSION_DEFAULT_CODEC[ext]?.codec || `${ext.toUpperCase()} Image`,
        resolution: imgRes || extractResolution(file.name, undefined, undefined, 'image'),
        type: 'image'
      };
    }

    // If MP4 / MOV / M4V / MKV and file is larger than 256KB, also read trailing 512KB.
    // In MP4/MOV, the moov atom containing true track sample entries (hvc1, hev1)
    // is frequently placed at the very end of the file.
    if ((ext === 'mp4' || ext === 'm4v' || ext === 'mov' || ext === 'mkv') && file.size > 262144) {
      try {
        const tailOffset = Math.max(0, file.size - 524288);
        const tailBuffer = await file.slice(tailOffset, file.size).arrayBuffer();
        const tailBytes = new Uint8Array(tailBuffer);
        textSample += ' ' + new TextDecoder('latin1').decode(tailBytes);
      } catch {
        // Fallback to head sample only
      }
    }

    // 1. Matroska / MKV / WebM
    // EBML header starts with 0x1A 0x45 0xDF 0xA3
    if (headBytes[0] === 0x1a && headBytes[1] === 0x45 && headBytes[2] === 0xdf && headBytes[3] === 0xa3) {
      return parseMatroskaCodecs(textSample, ext, file.name);
    }

    // 2. MP4 / MOV / M4V / 3GP
    // Check for ftyp atom or moov atom
    if (textSample.includes('ftyp') || textSample.includes('moov')) {
      return parseMp4Codecs(textSample, ext, file.name);
    }

    // 3. RIFF Containers (AVI, WAV, WebP)
    const bytes = headBytes;
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) { // 'RIFF'
      const riffType = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
      if (riffType === 'AVI ') {
        return parseAviCodecs(textSample, file.name);
      }
      if (riffType === 'WAVE') {
        return parseWavCodecs(bytes);
      }
      if (riffType === 'WEBP') {
        return { codec: 'WebP (VP8 / Lossless)', type: 'image' };
      }
    }

    // 4. FLAC
    if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) { // 'fLaC'
      return {
        codec: 'FLAC (Free Lossless Audio)',
        audioCodec: 'FLAC 24/16-bit Lossless',
        type: 'audio'
      };
    }

    // 5. MP3 (ID3v2 tag or MPEG audio sync frame)
    if ((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) {
      return {
        codec: 'MPEG-1 Layer 3 (MP3)',
        audioCodec: 'MP3 Stereo Audio',
        type: 'audio'
      };
    }

    // 6. Ogg Container (OggS)
    if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
      if (textSample.includes('OpusHead')) {
        return { codec: 'Opus Interactive Audio', audioCodec: 'Opus', type: 'audio' };
      }
      if (textSample.includes('vorbis')) {
        return { codec: 'Ogg Vorbis', audioCodec: 'Vorbis', type: 'audio' };
      }
      if (textSample.includes('theora')) {
        return { codec: 'Theora Video', audioCodec: 'Vorbis', type: 'video' };
      }
      return { codec: 'Ogg Media Stream', type: 'audio' };
    }

    // 7. JPEG
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { codec: 'JPEG / JFIF', type: 'image' };
    }

    // 8. PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return { codec: 'PNG (Deflate)', type: 'image' };
    }

    // 9. GIF
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      const ver = String.fromCharCode(bytes[3], bytes[4], bytes[5]);
      return { codec: `GIF (${ver})`, type: 'image' };
    }

    // 10. MPEG-TS (Sync byte 0x47)
    if (bytes[0] === 0x47 && (bytes[188] === 0x47 || bytes[192] === 0x47)) {
      const hint = nameHints.videoCodec || (textSample.includes('HEVC') ? 'H.265 / HEVC' : 'MPEG-2 Transport Stream');
      return { codec: hint, audioCodec: nameHints.audioCodec || 'AC-3 / AAC', type: 'video' };
    }

    // 11. Windows Media ASF (WMV / WMA)
    if (bytes[0] === 0x30 && bytes[1] === 0x26 && bytes[2] === 0xb2 && bytes[3] === 0x75) {
      const isVideo = ext === 'wmv' || textSample.includes('WMV') || textSample.includes('WVC1');
      return {
        codec: isVideo ? 'Windows Media Video (VC-1)' : 'Windows Media Audio (WMA)',
        audioCodec: 'WMA 9.2',
        type: isVideo ? 'video' : 'audio'
      };
    }

  } catch {
    // If reading arrayBuffer fails, use fallback
  }

  return fallback;
}

function parseMatroskaCodecs(text: string, ext: string, filename: string): CodecDetectionResult {
  const nameHints = extractFilenameHints(filename);
  let videoCodec = 'Matroska Video (MKV)';
  let audioCodec: string | undefined = nameHints.audioCodec;

  const textLower = text.toLowerCase();

  // Video Codec Detection in Matroska tracks - HEVC / H.265 checked first
  const isHevc = 
    text.includes('V_MPEGH/ISO/HEVC') || 
    text.includes('V_MPEGH') || 
    text.includes('V_MPEG4/ISO/HEVC') || 
    text.includes('V_HEVC') || 
    text.includes('V_H265') || 
    text.includes('hev1') || 
    text.includes('hvc1') || 
    text.includes('hvcC') || 
    text.includes('dvh1') || 
    text.includes('dvhe') || 
    text.includes('HEVC') || 
    textLower.includes('hevc') || 
    text.includes('H265') || 
    textLower.includes('h265') || 
    textLower.includes('x265') || 
    textLower.includes('h.265') || 
    nameHints.videoCodec === 'H.265 / HEVC';

  const isAvc = 
    !isHevc && (
      text.includes('V_MPEG4/ISO/AVC') || 
      text.includes('V_AVC') || 
      text.includes('avc1') || 
      text.includes('avc3') || 
      text.includes('avcC') || 
      text.includes('dva1') || 
      text.includes('dvav') || 
      text.includes('H264') || 
      textLower.includes('h264') || 
      textLower.includes('x264') || 
      textLower.includes('h.264') || 
      nameHints.videoCodec === 'H.264 / AVC'
    );

  if (isHevc) {
    videoCodec = 'H.265 / HEVC';
  } else if (isAvc) {
    videoCodec = 'H.264 / AVC';
  } else if (text.includes('V_AV1') || text.includes('av01') || textLower.includes('av01') || nameHints.videoCodec === 'AV1 (AOMedia Video 1)') {
    videoCodec = 'AV1 (AOMedia Video 1)';
  } else if (text.includes('V_VP9') || text.includes('vp09') || textLower.includes('vp09') || nameHints.videoCodec === 'VP9') {
    videoCodec = 'VP9';
  } else if (text.includes('V_VP8') || textLower.includes('vp08')) {
    videoCodec = 'VP8';
  } else if (text.includes('V_THEORA')) {
    videoCodec = 'Theora';
  } else if (text.includes('V_PRORES') || textLower.includes('prores') || nameHints.videoCodec === 'Apple ProRes') {
    videoCodec = 'Apple ProRes';
  } else if (ext === 'webm') {
    videoCodec = 'VP9 / AV1 (WebM)';
  } else {
    // If unknown, use name hint or generic container label — NEVER assume H.264!
    videoCodec = nameHints.videoCodec || 'Matroska Video (MKV)';
  }

  // Audio Codec IDs
  if (text.includes('A_TRUEHD')) {
    audioCodec = 'Dolby TrueHD Atmos';
  } else if (text.includes('A_DTS/LOSSLESS') || text.includes('A_DTS')) {
    audioCodec = 'DTS-HD Master Audio';
  } else if (text.includes('A_EAC3')) {
    audioCodec = 'Dolby Digital Plus (E-AC-3)';
  } else if (text.includes('A_AC3')) {
    audioCodec = 'Dolby Digital (AC-3 5.1)';
  } else if (text.includes('A_AAC')) {
    audioCodec = 'AAC-LC';
  } else if (text.includes('A_FLAC')) {
    audioCodec = 'FLAC Lossless';
  } else if (text.includes('A_OPUS')) {
    audioCodec = 'Opus Audio';
  } else if (text.includes('A_VORBIS')) {
    audioCodec = 'Vorbis';
  }

  return {
    codec: videoCodec,
    audioCodec: audioCodec || 'Multi-track Audio',
    type: ext === 'mka' ? 'audio' : 'video'
  };
}

function parseMp4Codecs(text: string, ext: string, filename: string): CodecDetectionResult {
  const nameHints = extractFilenameHints(filename);
  let videoCodec = 'MPEG-4 Video (MP4)';
  let audioCodec: string | undefined = nameHints.audioCodec;

  const textLower = text.toLowerCase();

  // Video Codecs in MP4 atoms - H.265 / HEVC checked first with priority
  const isHevc = 
    text.includes('hvc1') || 
    text.includes('hev1') || 
    text.includes('hvcC') || 
    text.includes('dvh1') || 
    text.includes('dvhe') || 
    text.includes('HEVC') || 
    textLower.includes('hevc') || 
    text.includes('H265') || 
    textLower.includes('h265') || 
    textLower.includes('x265') || 
    textLower.includes('h.265') || 
    nameHints.videoCodec === 'H.265 / HEVC';

  const isAvc = 
    !isHevc && (
      text.includes('avc1') || 
      text.includes('avc3') || 
      text.includes('avcC') || 
      text.includes('dva1') || 
      text.includes('dvav') || 
      text.includes('H264') || 
      textLower.includes('h264') || 
      textLower.includes('x264') || 
      nameHints.videoCodec === 'H.264 / AVC'
    );

  if (isHevc) {
    videoCodec = 'H.265 / HEVC';
  } else if (isAvc) {
    videoCodec = 'H.264 / AVC';
  } else if (text.includes('av01') || text.includes('av1C') || textLower.includes('av01') || nameHints.videoCodec === 'AV1 (AOMedia Video 1)') {
    videoCodec = 'AV1 (AOMedia Video 1)';
  } else if (text.includes('vp09') || text.includes('vpcC') || textLower.includes('vp09') || nameHints.videoCodec === 'VP9') {
    videoCodec = 'VP9';
  } else if (text.includes('apcn') || text.includes('apch') || text.includes('apco') || text.includes('apcs') || nameHints.videoCodec === 'Apple ProRes') {
    videoCodec = 'Apple ProRes';
  } else {
    // If unknown, use name hint or generic container label — NEVER assume H.264!
    videoCodec = nameHints.videoCodec || 'MPEG-4 Video (MP4)';
  }

  // Audio Codecs in MP4 atoms
  if (text.includes('mp4a')) {
    audioCodec = 'AAC-LC';
  } else if (text.includes('ac-3')) {
    audioCodec = 'Dolby Digital (AC-3)';
  } else if (text.includes('ec-3')) {
    audioCodec = 'Dolby Digital Plus (E-AC-3)';
  } else if (text.includes('alac')) {
    audioCodec = 'Apple Lossless (ALAC)';
  } else if (text.includes('Opus')) {
    audioCodec = 'Opus';
  } else if (text.includes('flac')) {
    audioCodec = 'FLAC';
  }

  if (ext === 'm4a') {
    return {
      codec: audioCodec || 'AAC Audio',
      audioCodec: audioCodec || 'AAC-LC',
      type: 'audio'
    };
  }

  return {
    codec: videoCodec,
    audioCodec: audioCodec || 'AAC Audio',
    type: 'video'
  };
}

function parseAviCodecs(text: string, filename: string): CodecDetectionResult {
  const nameHints = extractFilenameHints(filename);
  let videoCodec = 'AVI MPEG-4';

  if (
    text.includes('HEVC') || 
    text.includes('H265') || 
    nameHints.videoCodec === 'H.265 / HEVC'
  ) {
    videoCodec = 'H.265 / HEVC';
  } else if (
    text.includes('H264') || 
    text.includes('h264') || 
    text.includes('AVC1') || 
    text.includes('avc1') || 
    nameHints.videoCodec === 'H.264 / AVC'
  ) {
    videoCodec = 'H.264 / AVC (AVI)';
  } else if (text.includes('XVID') || text.includes('xvid')) {
    videoCodec = 'XviD (MPEG-4 Advanced Simple Profile)';
  } else if (text.includes('DIVX') || text.includes('DX50') || text.includes('divx')) {
    videoCodec = 'DivX (MPEG-4)';
  } else if (text.includes('MJPG') || text.includes('mjpg')) {
    videoCodec = 'Motion JPEG (MJPEG)';
  } else {
    videoCodec = nameHints.videoCodec || 'AVI (MPEG-4)';
  }

  return {
    codec: videoCodec,
    audioCodec: text.includes('ac-3') ? 'AC-3 (Dolby)' : 'MP3 Stereo',
    type: 'video'
  };
}

function parseWavCodecs(bytes: Uint8Array): CodecDetectionResult {
  let formatTag = 1; // 1 = PCM
  for (let i = 12; i < Math.min(bytes.length - 8, 200); i++) {
    if (bytes[i] === 0x66 && bytes[i+1] === 0x6d && bytes[i+2] === 0x74 && bytes[i+3] === 0x20) { // 'fmt '
      formatTag = bytes[i + 8] | (bytes[i + 9] << 8);
      break;
    }
  }

  let codec = 'PCM (Uncompressed)';
  if (formatTag === 3) codec = 'IEEE Float 32-bit';
  else if (formatTag === 6) codec = 'A-law PCM';
  else if (formatTag === 7) codec = 'mu-law PCM';
  else if (formatTag === 85) codec = 'MPEG Layer-3 in WAV';

  return {
    codec,
    audioCodec: codec,
    type: 'audio'
  };
}

export function inspectImageDimensionsFromBuffer(bytes: Uint8Array): { width: number; height: number } | undefined {
  if (bytes.length < 10) return undefined;

  // 1. PNG: magic 0x89 0x50 0x4E 0x47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    if (bytes.length >= 24) {
      const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      if (width > 0 && height > 0) return { width, height };
    }
  }

  // 2. GIF: magic GIF87a or GIF89a
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    if (bytes.length >= 10) {
      const width = bytes[6] | (bytes[7] << 8);
      const height = bytes[8] | (bytes[9] << 8);
      if (width > 0 && height > 0) return { width, height };
    }
  }

  // 3. BMP: magic BM (0x42 0x4D)
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    if (bytes.length >= 26) {
      const width = Math.abs(bytes[18] | (bytes[19] << 8) | (bytes[20] << 16) | (bytes[21] << 24));
      const height = Math.abs(bytes[22] | (bytes[23] << 8) | (bytes[24] << 16) | (bytes[25] << 24));
      if (width > 0 && height > 0) return { width, height };
    }
  }

  // 4. JPEG: Starts 0xFF 0xD8
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length - 8) {
      if (bytes[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = bytes[offset + 1];
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        if (width > 0 && height > 0) return { width, height };
      }
      const blockLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += 2 + blockLength;
    }
  }

  // 5. WebP: magic RIFF ... WEBP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
        if (bytes.length >= 30) {
          const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
          const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
          if (width > 0 && height > 0) return { width, height };
        }
      }
      if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x4c) {
        if (bytes.length >= 25) {
          const b1 = bytes[21];
          const b2 = bytes[22];
          const b3 = bytes[23];
          const b4 = bytes[24];
          const width = 1 + (((b2 & 0x3f) << 8) | b1);
          const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
          if (width > 0 && height > 0) return { width, height };
        }
      }
    }
  }

  return undefined;
}

export function extractResolution(
  filename: string, 
  codecDetails?: string, 
  dimensions?: { width: number; height: number }, 
  type?: MediaType
): string {
  if (type === 'audio') return '—';

  // For Image files: render Vertical x Horizontal pixel count (Height × Width)
  if (type === 'image') {
    if (dimensions && dimensions.width && dimensions.height) {
      return `${dimensions.height} × ${dimensions.width}`;
    }
    const textToScan = `${filename} ${codecDetails || ''}`;
    const dimMatch = textToScan.match(/(\d{2,5})\s*[x×]\s*(\d{2,5})/i);
    if (dimMatch) {
      const d1 = parseInt(dimMatch[1], 10);
      const d2 = parseInt(dimMatch[2], 10);
      return `${d2} × ${d1}`;
    }
    return '1080 × 1920';
  }

  // Video files: standard video resolution classification
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

  const textToScan = `${filename} ${codecDetails || ''}`;
  const lower = textToScan.toLowerCase();

  if (/(?:[._\-\s\[(]|^)(4320p|8k|uhd[\.\-_]?2)(?:[._\-\s\])]|$)/i.test(lower)) {
    return '8K (4320p)';
  }
  if (/(?:[._\-\s\[(]|^)(2160p|4k|uhd)(?:[._\-\s\])]|$)/i.test(lower)) {
    return '4K (2160p)';
  }
  if (/(?:[._\-\s\[(]|^)(1440p|2k|qhd|wqhd)(?:[._\-\s\])]|$)/i.test(lower)) {
    return '1440p (2K)';
  }
  if (/(?:[._\-\s\[(]|^)(1080p|1080i|fhd|full[\._\-\s]?hd|1920x1080)(?:[._\-\s\])]|$)/i.test(lower)) {
    return '1080p (FHD)';
  }
  if (/(?:[._\-\s\[(]|^)(720p|720i|1280x720)(?:[._\-\s\])]|$)/i.test(lower)) {
    return '720p (HD)';
  }
  if (/(?:[._\-\s\[(]|^)(576p|576i)(?:[._\-\s\])]|$)/i.test(lower)) {
    return '576p (PAL)';
  }
  if (/(?:[._\-\s\[(]|^)(480p|480i|sd)(?:[._\-\s\])]|$)/i.test(lower)) {
    return '480p (SD)';
  }

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
