const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanDirectoryNative: (folderPath) => ipcRenderer.invoke('scan-directory-native', folderPath),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  deleteFiles: (filePaths) => ipcRenderer.invoke('delete-files', filePaths),
  cancelScanNative: () => ipcRenderer.invoke('cancel-scan-native'),
  onScanProgress: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('scan-progress', listener);
    return () => ipcRenderer.removeListener('scan-progress', listener);
  },
  onScanItem: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('scan-item', listener);
    return () => ipcRenderer.removeListener('scan-item', listener);
  },
  onScanItemsBatch: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('scan-items-batch', listener);
    return () => ipcRenderer.removeListener('scan-items-batch', listener);
  }
});
