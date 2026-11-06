const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('catAPI', {
  getState: () => ipcRenderer.invoke('get-state'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  saveSettings: (patch) => ipcRenderer.send('save-settings', patch),
  setIgnore: (ignore) => ipcRenderer.send('set-ignore', ignore),
  startSelectRegion: () => ipcRenderer.send('start-select-region'),
  endSelectRegion: (region) => ipcRenderer.send('end-select-region', region),
  openSettings: () => ipcRenderer.send('open-settings'),
  quit: () => ipcRenderer.send('quit'),
  getPacks: () => ipcRenderer.invoke('get-packs'),
  savePack: (pack) => ipcRenderer.invoke('save-pack', pack),
  deletePack: (id) => ipcRenderer.invoke('delete-pack', id),
  onPacksChanged: (cb) => ipcRenderer.on('packs-changed', () => cb()),
  getSoundFiles: () => ipcRenderer.invoke('get-sound-files'),
  openSoundFolder: () => ipcRenderer.send('open-sound-folder'),
  openImageFolder: () => ipcRenderer.send('open-image-folder'),
  onSoundsChanged: (cb) => ipcRenderer.on('sounds-changed', () => cb()),
  onSettings: (cb) => ipcRenderer.on('settings', (_e, s) => cb(s)),
  onBeginSelect: (cb) => ipcRenderer.on('begin-select', () => cb()),
  onSummon: (cb) => ipcRenderer.on('summon', () => cb())
});
