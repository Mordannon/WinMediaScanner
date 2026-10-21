import React from 'react';
import { Trash2, AlertTriangle, X, HardDrive, FileText } from 'lucide-react';
import { MediaItem } from '../types/media.ts';
import { formatBytes } from '../utils/formatters.ts';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  itemsToDelete: MediaItem[];
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  itemsToDelete,
  onConfirm,
  onCancel,
  isDeleting = false
}) => {
  if (!isOpen || itemsToDelete.length === 0) return null;

  const isSingle = itemsToDelete.length === 1;
  const singleItem = itemsToDelete[0];
  const totalSizeBytes = itemsToDelete.reduce((acc, item) => acc + item.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-rose-900/50 rounded-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-950/40 border-b border-rose-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Confirm Filesystem Deletion</span>
              </h2>
              <p className="text-xs text-rose-300 font-mono">
                {isSingle ? '1 file selected for deletion' : `${itemsToDelete.length} files selected for deletion`}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg text-slate-300 leading-relaxed">
            <p className="text-rose-200 font-medium mb-1">
              Warning: This action will delete file(s) directly from your hard drive filesystem!
            </p>
            <p className="text-slate-400 text-[11px]">
              Files will be safely sent to your Windows Recycle Bin via Electron API.
            </p>
          </div>

          {/* Details */}
          {isSingle ? (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-mono font-semibold text-xs truncate">
                <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate" title={singleItem.name}>{singleItem.name}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded border border-slate-800 break-all">
                {singleItem.fullPath}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Type: <strong className="text-slate-200 uppercase font-mono">{singleItem.extension}</strong></span>
                <span className="flex items-center gap-1 font-mono text-slate-200">
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  {singleItem.sizeFormatted}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
                <span>Selected Items ({itemsToDelete.length})</span>
                <span className="font-mono text-amber-400 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  Total Size: {formatBytes(totalSizeBytes)}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto bg-slate-950/80 rounded-lg border border-slate-800 divide-y divide-slate-800/60 font-mono text-[11px]">
                {itemsToDelete.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-900/60">
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200 truncate font-semibold">{item.name}</p>
                      <p className="text-slate-500 text-[10px] truncate">{item.folder}</p>
                    </div>
                    <span className="text-slate-400 shrink-0 text-[10px]">{item.sizeFormatted}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 text-xs">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-lg transition-all shadow-md shadow-rose-950/50 flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : isSingle ? 'Delete File' : `Delete ${itemsToDelete.length} Files`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
