import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Film, Music, Image as ImageIcon, HardDrive, Folder, Cpu, Calendar, Play, Monitor } from 'lucide-react';
import { MediaItem } from '../types/media';

interface FileDetailsModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onFilterByFolder: (folder: string) => void;
  onFilterByCodec: (codec: string) => void;
  onDeleteFile?: (item: MediaItem) => void;
  onOpenFile?: (filePath: string) => void;
}

export const FileDetailsModal: React.FC<FileDetailsModalProps> = ({
  item,
  onClose,
  onFilterByFolder,
  onFilterByCodec,
  onDeleteFile,
  onOpenFile
}) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (item?.fileRef) {
      const url = URL.createObjectURL(item.fileRef);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [item]);

  if (!item) return null;

  const copyPath = () => {
    navigator.clipboard.writeText(item.fullPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleOpen = () => {
    if (onOpenFile) {
      onOpenFile(item.fullPath);
    } else if (typeof window !== 'undefined' && window.electronAPI?.openFile) {
      window.electronAPI.openFile(item.fullPath);
    }
  };

  const handleDelete = () => {
    if (onDeleteFile) {
      onDeleteFile(item);
    }
  };

  const isPlayableVideo = item.type === 'video' && ['mp4', 'webm', 'ogg', 'mov'].includes(item.extension);
  const isPlayableAudio = item.type === 'audio' && ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus'].includes(item.extension);
  const isImage = item.type === 'image';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              {item.type === 'video' && <Film className="w-4 h-4" />}
              {item.type === 'audio' && <Music className="w-4 h-4" />}
              {item.type === 'image' && <ImageIcon className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate font-mono" title={item.name}>
                {item.name}
              </h2>
              <p className="text-[11px] text-slate-400 uppercase font-mono">
                {item.type} · .{item.extension}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpen}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Open file in default system application"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Open File</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Windows Full Path Card */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1 text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                Windows Path
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpen}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-semibold"
                >
                  <Play className="w-3 h-3 fill-emerald-400" />
                  <span>Open File</span>
                </button>
                <button
                  onClick={copyPath}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                >
                  {copiedPath ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Path</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="font-mono text-slate-200 text-[11px] break-all select-all bg-slate-900/80 p-2 rounded border border-slate-800">
              {item.fullPath}
            </p>
          </div>

          {/* Technical Specs Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Codec */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                Primary Codec
              </span>
              <p className="font-mono font-semibold text-white text-[13px]">{item.codec}</p>
              {item.codecDetails && (
                <p className="font-mono text-[11px] text-slate-400 mt-0.5">{item.codecDetails}</p>
              )}
            </div>

            {/* Audio Codec */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Music className="w-3.5 h-3.5 text-emerald-400" />
                Audio Stream
              </span>
              <p className="font-mono font-semibold text-white text-[13px]">
                {item.audioCodec || '—'}
              </p>
            </div>

            {/* Resolution */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Monitor className="w-3.5 h-3.5 text-purple-400" />
                Resolution
              </span>
              <p className="font-mono font-semibold text-white text-[13px]">
                {item.resolution || '—'}
              </p>
            </div>

            {/* File Size */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                File Size
              </span>
              <p className="font-mono font-semibold text-white text-[13px] tabular-nums">
                {item.sizeFormatted}
              </p>
              <p className="font-mono text-[11px] text-slate-400 tabular-nums">
                {item.size.toLocaleString()} bytes
              </p>
            </div>

            {/* Last Modified */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-3">
              <span className="text-slate-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Last Modified
              </span>
              <p className="font-mono text-slate-200 text-[12px]">
                {item.lastModifiedFormatted || '—'}
              </p>
            </div>
          </div>

          {/* Browser Media Preview if available */}
          {previewUrl && (
            <div className="pt-2">
              <span className="font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-blue-400" />
                Media Preview
              </span>
              <div className="bg-slate-950 rounded-lg border border-slate-800 p-2 flex items-center justify-center overflow-hidden max-h-56">
                {isPlayableVideo && (
                  <video src={previewUrl} controls className="max-h-52 rounded w-full" />
                )}
                {isPlayableAudio && (
                  <audio src={previewUrl} controls className="w-full" />
                )}
                {isImage && (
                  <img src={previewUrl} alt={item.name} className="max-h-52 object-contain rounded" />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Filter Shortcuts and Delete Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onFilterByFolder(item.folder);
                onClose();
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono transition-colors"
            >
              Filter by this folder
            </button>
            <button
              onClick={() => {
                onFilterByCodec(item.codec);
                onClose();
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono transition-colors"
            >
              Filter by this codec
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onDeleteFile && (
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-rose-100 rounded-lg font-medium transition-colors flex items-center gap-1.5"
              >
                <span>Delete File</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
