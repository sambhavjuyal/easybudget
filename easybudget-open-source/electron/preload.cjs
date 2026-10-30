const { contextBridge, ipcRenderer } = require('electron');

// The only things the page can ask the desktop app to do.
contextBridge.exposeInMainWorld('easybudget', {
  keyStatus: () => ipcRenderer.invoke('key:status'),
  saveKey: (key) => ipcRenderer.invoke('key:save', key),
  clearKey: () => ipcRenderer.invoke('key:clear'),
  searchJobs: (req) => ipcRenderer.invoke('jobs:search', req),
});
