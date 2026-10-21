import { MediaItem } from '../types/media.ts';
import { formatBytes, formatDate } from './formatters.ts';
import { extractResolution } from './codecDetector.ts';

const RAW_SAMPLE_MEDIA_LIBRARY: MediaItem[] = [
  // 4K & High-Res Movies
  {
    id: 'sample_01',
    name: 'Dune.Part.Two.2024.2160p.UHD.Remux.HEVC.DV.TrueHD.Atmos.mkv',
    folder: 'D:\\MediaLibrary\\Movies\\4K HDR',
    fullPath: 'D:\\MediaLibrary\\Movies\\4K HDR\\Dune.Part.Two.2024.2160p.UHD.Remux.HEVC.DV.TrueHD.Atmos.mkv',
    codec: 'H.265 / HEVC',
    codecDetails: 'Main 10@L5.1, Dolby Vision, HDR10, 23.976 fps',
    audioCodec: 'Dolby TrueHD Atmos 7.1',
    extension: 'mkv',
    size: 68719476736, // ~64 GB
    sizeFormatted: formatBytes(68719476736),
    type: 'video',
    lastModified: 1711886400000,
    lastModifiedFormatted: formatDate(1711886400000)
  },
  {
    id: 'sample_02',
    name: 'Oppenheimer.2023.IMAX.2160p.HDR10Plus.HEVC.DTS-HD.MA.5.1.mkv',
    folder: 'D:\\MediaLibrary\\Movies\\4K HDR',
    fullPath: 'D:\\MediaLibrary\\Movies\\4K HDR\\Oppenheimer.2023.IMAX.2160p.HDR10Plus.HEVC.DTS-HD.MA.5.1.mkv',
    codec: 'H.265 / HEVC',
    codecDetails: 'Main 10@L5.1, IMAX Enhanced HDR10+',
    audioCodec: 'DTS-HD Master Audio 5.1',
    extension: 'mkv',
    size: 53687091200, // 50 GB
    sizeFormatted: formatBytes(53687091200),
    type: 'video',
    lastModified: 1700654400000,
    lastModifiedFormatted: formatDate(1700654400000)
  },
  {
    id: 'sample_03',
    name: 'Interstellar.2014.1080p.BluRay.x264.DTS-HD.MA.mkv',
    folder: 'D:\\MediaLibrary\\Movies\\Sci-Fi',
    fullPath: 'D:\\MediaLibrary\\Movies\\Sci-Fi\\Interstellar.2014.1080p.BluRay.x264.DTS-HD.MA.mkv',
    codec: 'H.264 / AVC',
    codecDetails: 'High@L4.1, 1920x1080, 24 fps',
    audioCodec: 'DTS-HD MA 5.1',
    extension: 'mkv',
    size: 14828855296, // 13.8 GB
    sizeFormatted: formatBytes(14828855296),
    type: 'video',
    lastModified: 1675123200000,
    lastModifiedFormatted: formatDate(1675123200000)
  },
  {
    id: 'sample_04',
    name: 'Blade.Runner.2049.2017.1080p.WEBRip.x264.AAC.mp4',
    folder: 'D:\\MediaLibrary\\Movies\\Sci-Fi',
    fullPath: 'D:\\MediaLibrary\\Movies\\Sci-Fi\\Blade.Runner.2049.2017.1080p.WEBRip.x264.AAC.mp4',
    codec: 'H.264 / AVC',
    codecDetails: 'Main@L4.0, 1920x804, 23.976 fps',
    audioCodec: 'AAC-LC 5.1 (384 kbps)',
    extension: 'mp4',
    size: 3221225472, // 3 GB
    sizeFormatted: formatBytes(3221225472),
    type: 'video',
    lastModified: 1682856000000,
    lastModifiedFormatted: formatDate(1682856000000)
  },
  {
    id: 'sample_05',
    name: 'The.Matrix.1999.2160p.AV1.10bit.Opus.mkv',
    folder: 'D:\\MediaLibrary\\Movies\\Sci-Fi',
    fullPath: 'D:\\MediaLibrary\\Movies\\Sci-Fi\\The.Matrix.1999.2160p.AV1.10bit.Opus.mkv',
    codec: 'AV1 (AOMedia Video 1)',
    codecDetails: 'Main@L5.1 10-bit, HDR',
    audioCodec: 'Opus 5.1 (320 kbps)',
    extension: 'mkv',
    size: 11811160064, // 11 GB
    sizeFormatted: formatBytes(11811160064),
    type: 'video',
    lastModified: 1708420000000,
    lastModifiedFormatted: formatDate(1708420000000)
  },
  {
    id: 'sample_06',
    name: 'Planet.Earth.III.S01E01.Coasts.2160p.UHD.HEVC.mkv',
    folder: 'D:\\MediaLibrary\\TV Shows\\Planet Earth III\\Season 01',
    fullPath: 'D:\\MediaLibrary\\TV Shows\\Planet Earth III\\Season 01\\Planet.Earth.III.S01E01.Coasts.2160p.UHD.HEVC.mkv',
    codec: 'H.265 / HEVC',
    codecDetails: 'Main 10@L5.1, HLG HDR',
    audioCodec: 'Dolby Digital Plus 5.1',
    extension: 'mkv',
    size: 8589934592, // 8 GB
    sizeFormatted: formatBytes(8589934592),
    type: 'video',
    lastModified: 1698750000000,
    lastModifiedFormatted: formatDate(1698750000000)
  },
  {
    id: 'sample_07',
    name: 'Planet.Earth.III.S01E02.Ocean.2160p.UHD.HEVC.mkv',
    folder: 'D:\\MediaLibrary\\TV Shows\\Planet Earth III\\Season 01',
    fullPath: 'D:\\MediaLibrary\\TV Shows\\Planet Earth III\\Season 01\\Planet.Earth.III.S01E02.Ocean.2160p.UHD.HEVC.mkv',
    codec: 'H.265 / HEVC',
    codecDetails: 'Main 10@L5.1, HLG HDR',
    audioCodec: 'Dolby Digital Plus 5.1',
    extension: 'mkv',
    size: 8257077248, // 7.69 GB
    sizeFormatted: formatBytes(8257077248),
    type: 'video',
    lastModified: 1699354800000,
    lastModifiedFormatted: formatDate(1699354800000)
  },
  {
    id: 'sample_08',
    name: 'Shrek.2.2004.720p.HDTV.XviD.AC3.avi',
    folder: 'D:\\MediaLibrary\\Movies\\Animation',
    fullPath: 'D:\\MediaLibrary\\Movies\\Animation\\Shrek.2.2004.720p.HDTV.XviD.AC3.avi',
    codec: 'XviD (MPEG-4)',
    codecDetails: 'ASP@L5, 1280x720',
    audioCodec: 'AC-3 (Dolby Digital)',
    extension: 'avi',
    size: 2306867200, // 2.15 GB
    sizeFormatted: formatBytes(2306867200),
    type: 'video',
    lastModified: 1541246400000,
    lastModifiedFormatted: formatDate(1541246400000)
  },
  {
    id: 'sample_09',
    name: 'Tokyo_Street_Night_Walk_4K60.webm',
    folder: 'C:\\Users\\Jon\\Videos\\Web Downloads',
    fullPath: 'C:\\Users\\Jon\\Videos\\Web Downloads\\Tokyo_Street_Night_Walk_4K60.webm',
    codec: 'VP9',
    codecDetails: 'Profile 2, 3840x2160 60fps',
    audioCodec: 'Opus (160 kbps)',
    extension: 'webm',
    size: 1982840832, // 1.85 GB
    sizeFormatted: formatBytes(1982840832),
    type: 'video',
    lastModified: 1715428800000,
    lastModifiedFormatted: formatDate(1715428800000)
  },
  {
    id: 'sample_10',
    name: 'Commercial_Master_Cut_v04_ProRes422HQ.mov',
    folder: 'C:\\Users\\Jon\\Videos\\Work Projects',
    fullPath: 'C:\\Users\\Jon\\Videos\\Work Projects\\Commercial_Master_Cut_v04_ProRes422HQ.mov',
    codec: 'Apple ProRes',
    codecDetails: 'ProRes 422 HQ, 10-bit 4:2:2, 220 Mbps',
    audioCodec: 'Linear PCM 24-bit 48kHz Stereo',
    extension: 'mov',
    size: 24700000000, // 23 GB
    sizeFormatted: formatBytes(24700000000),
    type: 'video',
    lastModified: 1726056000000,
    lastModifiedFormatted: formatDate(1726056000000)
  },
  {
    id: 'sample_11',
    name: 'Conference_Keynote_2024.wmv',
    folder: 'C:\\Users\\Jon\\Videos\\Archives',
    fullPath: 'C:\\Users\\Jon\\Videos\\Archives\\Conference_Keynote_2024.wmv',
    codec: 'Windows Media Video 9 (VC-1)',
    codecDetails: 'WMV3 / Advanced Profile',
    audioCodec: 'WMA 9.2 (192 kbps)',
    extension: 'wmv',
    size: 1572864000, // 1.46 GB
    sizeFormatted: formatBytes(1572864000),
    type: 'video',
    lastModified: 1684584000000,
    lastModifiedFormatted: formatDate(1684584000000)
  },

  // Lossless Audio FLAC
  {
    id: 'sample_12',
    name: '01 - Time.flac',
    folder: 'C:\\Users\\Jon\\Music\\Pink Floyd - The Dark Side of the Moon (1973) [24-96 Remaster]',
    fullPath: 'C:\\Users\\Jon\\Music\\Pink Floyd - The Dark Side of the Moon (1973) [24-96 Remaster]\\01 - Time.flac',
    codec: 'FLAC (Free Lossless Audio)',
    codecDetails: '24-bit / 96.0 kHz, 2980 kbps',
    audioCodec: 'FLAC Lossless',
    extension: 'flac',
    size: 154828800, // 147.6 MB
    sizeFormatted: formatBytes(154828800),
    type: 'audio',
    lastModified: 1690891200000,
    lastModifiedFormatted: formatDate(1690891200000)
  },
  {
    id: 'sample_13',
    name: '02 - Money.flac',
    folder: 'C:\\Users\\Jon\\Music\\Pink Floyd - The Dark Side of the Moon (1973) [24-96 Remaster]',
    fullPath: 'C:\\Users\\Jon\\Music\\Pink Floyd - The Dark Side of the Moon (1973) [24-96 Remaster]\\02 - Money.flac',
    codec: 'FLAC (Free Lossless Audio)',
    codecDetails: '24-bit / 96.0 kHz, 3050 kbps',
    audioCodec: 'FLAC Lossless',
    extension: 'flac',
    size: 148580000, // 141.7 MB
    sizeFormatted: formatBytes(148580000),
    type: 'audio',
    lastModified: 1690891400000,
    lastModifiedFormatted: formatDate(1690891400000)
  },
  {
    id: 'sample_14',
    name: '01 - Give Life Back to Music.flac',
    folder: 'C:\\Users\\Jon\\Music\\Daft Punk - Random Access Memories (2013)',
    fullPath: 'C:\\Users\\Jon\\Music\\Daft Punk - Random Access Memories (2013)\\01 - Give Life Back to Music.flac',
    codec: 'FLAC (Free Lossless Audio)',
    codecDetails: '16-bit / 44.1 kHz, 940 kbps',
    audioCodec: 'FLAC Lossless',
    extension: 'flac',
    size: 32180000, // 30.6 MB
    sizeFormatted: formatBytes(32180000),
    type: 'audio',
    lastModified: 1654167600000,
    lastModifiedFormatted: formatDate(1654167600000)
  },
  {
    id: 'sample_15',
    name: '08 - Get Lucky (feat. Pharrell Williams).flac',
    folder: 'C:\\Users\\Jon\\Music\\Daft Punk - Random Access Memories (2013)',
    fullPath: 'C:\\Users\\Jon\\Music\\Daft Punk - Random Access Memories (2013)\\08 - Get Lucky (feat. Pharrell Williams).flac',
    codec: 'FLAC (Free Lossless Audio)',
    codecDetails: '16-bit / 44.1 kHz, 980 kbps',
    audioCodec: 'FLAC Lossless',
    extension: 'flac',
    size: 44200000, // 42.1 MB
    sizeFormatted: formatBytes(44200000),
    type: 'audio',
    lastModified: 1654167900000,
    lastModifiedFormatted: formatDate(1654167900000)
  },

  // Lossy MP3 & AAC Audio
  {
    id: 'sample_16',
    name: 'Queen - Bohemian Rhapsody (Remastered 2011).mp3',
    folder: 'C:\\Users\\Jon\\Music\\MP3 Collection\\Rock Classics',
    fullPath: 'C:\\Users\\Jon\\Music\\MP3 Collection\\Rock Classics\\Queen - Bohemian Rhapsody (Remastered 2011).mp3',
    codec: 'MPEG-1 Layer 3 (MP3)',
    codecDetails: '320 kbps CBR, 44.1 kHz, Joint Stereo',
    audioCodec: 'MP3 Audio',
    extension: 'mp3',
    size: 14200000, // 13.5 MB
    sizeFormatted: formatBytes(14200000),
    type: 'audio',
    lastModified: 1642890000000,
    lastModifiedFormatted: formatDate(1642890000000)
  },
  {
    id: 'sample_17',
    name: 'Led Zeppelin - Stairway to Heaven.mp3',
    folder: 'C:\\Users\\Jon\\Music\\MP3 Collection\\Rock Classics',
    fullPath: 'C:\\Users\\Jon\\Music\\MP3 Collection\\Rock Classics\\Led Zeppelin - Stairway to Heaven.mp3',
    codec: 'MPEG-1 Layer 3 (MP3)',
    codecDetails: '320 kbps CBR, 44.1 kHz',
    audioCodec: 'MP3 Audio',
    extension: 'mp3',
    size: 19800000, // 18.8 MB
    sizeFormatted: formatBytes(19800000),
    type: 'audio',
    lastModified: 1642890200000,
    lastModifiedFormatted: formatDate(1642890200000)
  },
  {
    id: 'sample_18',
    name: 'Dan Carlin - Hardcore History 68 - Supernova in the East VI.m4a',
    folder: 'C:\\Users\\Jon\\Podcasts\\Hardcore History',
    fullPath: 'C:\\Users\\Jon\\Podcasts\\Hardcore History\\Dan Carlin - Hardcore History 68 - Supernova in the East VI.m4a',
    codec: 'AAC-LC',
    codecDetails: '128 kbps AAC, 44.1 kHz',
    audioCodec: 'AAC Audio',
    extension: 'm4a',
    size: 320000000, // 305 MB
    sizeFormatted: formatBytes(320000000),
    type: 'audio',
    lastModified: 1623240000000,
    lastModifiedFormatted: formatDate(1623240000000)
  },
  {
    id: 'sample_19',
    name: 'Ambient_Forest_Rain_Binaural_96k.wav',
    folder: 'D:\\AudioLibrary\\Soundscapes',
    fullPath: 'D:\\AudioLibrary\\Soundscapes\\Ambient_Forest_Rain_Binaural_96k.wav',
    codec: 'PCM (Linear Uncompressed)',
    codecDetails: '24-bit / 96.0 kHz Stereo (4608 kbps)',
    audioCodec: 'WAV PCM 24-bit',
    extension: 'wav',
    size: 552960000, // 527 MB
    sizeFormatted: formatBytes(552960000),
    type: 'audio',
    lastModified: 1718020000000,
    lastModifiedFormatted: formatDate(1718020000000)
  },
  {
    id: 'sample_20',
    name: 'Voice_Memo_Meeting_Notes.opus',
    folder: 'C:\\Users\\Jon\\Documents\\Audio Memos',
    fullPath: 'C:\\Users\\Jon\\Documents\\Audio Memos\\Voice_Memo_Meeting_Notes.opus',
    codec: 'Opus Interactive Audio',
    codecDetails: '64 kbps VBR, 48 kHz',
    audioCodec: 'Opus Mono',
    extension: 'opus',
    size: 8900000, // 8.48 MB
    sizeFormatted: formatBytes(8900000),
    type: 'audio',
    lastModified: 1728114000000,
    lastModifiedFormatted: formatDate(1728114000000)
  },

  // High Resolution Photos & Visual Media
  {
    id: 'sample_21',
    name: 'DSC_0842_Yosemite_Valley_Sunrise.dng',
    folder: 'E:\\Photography\\2026 Portfolio\\Yosemite National Park',
    fullPath: 'E:\\Photography\\2026 Portfolio\\Yosemite National Park\\DSC_0842_Yosemite_Valley_Sunrise.dng',
    codec: 'Adobe Digital Negative (DNG)',
    codecDetails: '14-bit Uncompressed RAW, 8256x5504 (45.7 MP)',
    extension: 'dng',
    size: 56420000, // 53.8 MB
    sizeFormatted: formatBytes(56420000),
    type: 'image',
    lastModified: 1716534000000,
    lastModifiedFormatted: formatDate(1716534000000)
  },
  {
    id: 'sample_22',
    name: 'DSC_0842_Yosemite_Valley_Sunrise_Edited.tiff',
    folder: 'E:\\Photography\\2026 Portfolio\\Yosemite National Park',
    fullPath: 'E:\\Photography\\2026 Portfolio\\Yosemite National Park\\DSC_0842_Yosemite_Valley_Sunrise_Edited.tiff',
    codec: 'TIFF (Tagged Image File Format)',
    codecDetails: '16-bit ProPhoto RGB, 8256x5504',
    extension: 'tiff',
    size: 272480000, // 259.8 MB
    sizeFormatted: formatBytes(272480000),
    type: 'image',
    lastModified: 1716540000000,
    lastModifiedFormatted: formatDate(1716540000000)
  },
  {
    id: 'sample_23',
    name: 'DSC_0842_Yosemite_Valley_Sunrise_Web.jpg',
    folder: 'E:\\Photography\\2026 Portfolio\\Yosemite National Park',
    fullPath: 'E:\\Photography\\2026 Portfolio\\Yosemite National Park\\DSC_0842_Yosemite_Valley_Sunrise_Web.jpg',
    codec: 'JPEG / JFIF',
    codecDetails: 'sRGB, Quality 92, 3840x2560',
    extension: 'jpg',
    size: 4210000, // 4.01 MB
    sizeFormatted: formatBytes(4210000),
    type: 'image',
    lastModified: 1716542000000,
    lastModifiedFormatted: formatDate(1716542000000)
  },
  {
    id: 'sample_24',
    name: 'Iceland_Aurora_Borealis_Panorama.avif',
    folder: 'E:\\Photography\\2026 Portfolio\\Nordic Lights',
    fullPath: 'E:\\Photography\\2026 Portfolio\\Nordic Lights\\Iceland_Aurora_Borealis_Panorama.avif',
    codec: 'AVIF (AV1 Image File Format)',
    codecDetails: '10-bit HDR, Rec.2020, 6000x2500',
    extension: 'avif',
    size: 2850000, // 2.71 MB
    sizeFormatted: formatBytes(2850000),
    type: 'image',
    lastModified: 1705820000000,
    lastModifiedFormatted: formatDate(1705820000000)
  },
  {
    id: 'sample_25',
    name: 'Logo_Vector_Master_CMYK.png',
    folder: 'C:\\Users\\Jon\\Pictures\\Brand Assets',
    fullPath: 'C:\\Users\\Jon\\Pictures\\Brand Assets\\Logo_Vector_Master_CMYK.png',
    codec: 'PNG (Deflate)',
    codecDetails: 'RGBA 32-bit with Alpha Channel, 4096x4096',
    extension: 'png',
    size: 1850000, // 1.76 MB
    sizeFormatted: formatBytes(1850000),
    type: 'image',
    lastModified: 1699990000000,
    lastModifiedFormatted: formatDate(1699990000000)
  },
  {
    id: 'sample_26',
    name: 'UI_Micro_Interaction_Animation.webp',
    folder: 'C:\\Users\\Jon\\Pictures\\Web Assets',
    fullPath: 'C:\\Users\\Jon\\Pictures\\Web Assets\\UI_Micro_Interaction_Animation.webp',
    codec: 'WebP (VP8 / Lossless)',
    codecDetails: 'Animated WebP, 60 frames, 800x600',
    extension: 'webp',
    size: 840000, // 820 KB
    sizeFormatted: formatBytes(840000),
    type: 'image',
    lastModified: 1722410000000,
    lastModifiedFormatted: formatDate(1722410000000)
  }
];

export const SAMPLE_MEDIA_LIBRARY: MediaItem[] = RAW_SAMPLE_MEDIA_LIBRARY.map(item => ({
  ...item,
  resolution: item.resolution || extractResolution(item.name, item.codecDetails, item.dimensions, item.type)
}));
