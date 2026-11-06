// 냥멍마실 (NyangMeongStroll) — 메인 프로세스
const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell } = require('electron');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');

// 설정 저장 위치를 항상 같은 이름으로 (폴더판·포터블판이 설정을 함께 써요)
// 예전 이름(데스크톱 냥이) 폴더에 설정이 있으면 처음 한 번 옮겨와요
try {
  const userDir = path.join(app.getPath('appData'), '냥멍마실');
  const oldDir = path.join(app.getPath('appData'), '데스크톱 냥이');
  if (!fs.existsSync(path.join(userDir, 'settings.json')) && fs.existsSync(path.join(oldDir, 'settings.json'))) {
    fs.mkdirSync(userDir, { recursive: true });
    fs.copyFileSync(path.join(oldDir, 'settings.json'), path.join(userDir, 'settings.json'));
    if (fs.existsSync(path.join(oldDir, 'packs'))) fs.cpSync(path.join(oldDir, 'packs'), path.join(userDir, 'packs'), { recursive: true });
  }
  app.setPath('userData', userDir);
} catch {}
// 포터블 exe는 임시 폴더에서 실행되므로, 실제 exe 위치는 환경변수로 알려줘요
const PORTABLE_DIR = process.env.PORTABLE_EXECUTABLE_DIR || null;
const PORTABLE_FILE = process.env.PORTABLE_EXECUTABLE_FILE || null;

const DEFAULTS = {
  cats: [
    { id: 'c1', breed: 'tabby', name: '고등어' },
    { id: 'c2', breed: 'dog-corgi', name: '코기' }
  ],
  size: 90,            // 고양이 높이(px)
  region: null,        // {x,y,w,h} 모니터 기준 좌표. null = 모니터 전체
  displayId: null,     // null = 주 모니터
  sound: true,         // 울음 소리
  catSound: -1,        // 고양이 소리 (0~4 = sounds 폴더 cat1~5, -1 = 랜덤)
  dogSound: -1,        // 강아지 소리 (0~4 = sounds 폴더 dog1~5, -1 = 랜덤)
  soundVer: 2,
  volume: 0.6,
  lang: 'ko',          // 'ko' 한국어 / 'en' English
  activity: 1,         // 활동량 0.5(느긋) ~ 1.5(활발)
  showNames: false,
  paused: false,
  autoStart: false
};

let settingsPath;
let settings;
let overlay = null;
let settingsWin = null;
let tray = null;

function loadSettings() {
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  let saved = null;
  try {
    saved = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    settings = { ...DEFAULTS, ...saved };
  } catch {
    settings = JSON.parse(JSON.stringify(DEFAULTS));
  }
  // 녹음 파일 전용 소리로 바뀐 뒤 처음 실행: 소리 켜고 랜덤으로
  if (saved && (saved.soundVer || 0) < 2) {
    settings.sound = true; settings.catSound = -1; settings.dogSound = -1; settings.soundVer = 2;
    try { fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2)); } catch {}
  }
}
function saveSettings() {
  try { fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2)); } catch (e) { console.error(e); }
}

function targetDisplay() {
  const all = screen.getAllDisplays();
  return all.find(d => d.id === settings.displayId) || screen.getPrimaryDisplay();
}

function displayInfo(d) {
  const b = d.bounds, wa = d.workArea;
  return {
    width: b.width, height: b.height,
    // 작업 표시줄을 뺀 영역 (모니터 기준 좌표)
    workArea: { x: wa.x - b.x, y: wa.y - b.y, w: wa.width, h: wa.height }
  };
}

function createOverlay() {
  if (overlay && !overlay.isDestroyed()) overlay.destroy();
  const d = targetDisplay();
  const b = d.bounds;
  overlay = new BrowserWindow({
    x: b.x, y: b.y, width: b.width, height: b.height,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  if (process.platform === 'darwin') {
    overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  // 고양이가 없는 곳은 클릭이 아래 창으로 그대로 통과
  overlay.setIgnoreMouseEvents(true, { forward: true });
  overlay.loadFile(path.join(__dirname, 'renderer', 'overlay.html'));
  overlay.once('ready-to-show', () => overlay.showInactive());
}

function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.show(); settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 540, height: 760,
    minWidth: 420, minHeight: 500,
    title: tx('title'),
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  settingsWin.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

function broadcast() {
  const payload = { settings, display: displayInfo(targetDisplay()) };
  if (overlay && !overlay.isDestroyed()) overlay.webContents.send('settings', payload);
  if (settingsWin && !settingsWin.isDestroyed()) settingsWin.webContents.send('settings', payload);
  buildTrayMenu();
}

function buildTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: tx('open'), click: openSettings },
    { label: settings.paused ? tx('show') : tx('hide'), click: () => { settings.paused = !settings.paused; saveSettings(); broadcast(); } },
    { label: tx('summon'), click: () => overlay && overlay.webContents.send('summon') },
    { type: 'separator' },
    { label: tx('quit'), click: () => app.quit() }
  ]));
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png'));
  tray = new Tray(icon);
  tray.setToolTip(tx('tip'));
  tray.on('click', openSettings);
  buildTrayMenu();
}

// ---- 메뉴 글자 (한국어 / English) ----
const TXT = {
  ko: { title: '냥멍마실 설정', tip: '냥멍마실', open: '설정 열기', show: '동물들 다시 보이기', hide: '동물들 잠깐 숨기기', summon: '모두 불러오기', quit: '종료', mon: '모니터', primary: '주 모니터' },
  en: { title: 'NyangMeongStroll Settings', tip: 'NyangMeongStroll', open: 'Open settings', show: 'Show pets again', hide: 'Hide pets for a while', summon: 'Call everyone', quit: 'Quit', mon: 'Monitor', primary: 'primary' }
};
const tx = (k) => (TXT[settings && settings.lang === 'en' ? 'en' : 'ko'])[k];

// ---- 내가 추가한 그림 묶음(팩) ----
function packsDir() {
  const d = path.join(app.getPath('userData'), 'packs');
  fs.mkdirSync(d, { recursive: true });
  return d;
}
function readPacks() {
  const d = packsDir();
  return fs.readdirSync(d).filter(f => f.endsWith('.json')).map(f => {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
      const png = fs.readFileSync(path.join(d, meta.id + '.png'));
      return { ...meta, img: 'data:image/png;base64,' + png.toString('base64') };
    } catch (e) { console.error('팩 읽기 실패', f, e); return null; }
  }).filter(Boolean).sort((a, b) => (a.created || 0) - (b.created || 0));
}
function notifyPacks() {
  [overlay, settingsWin].forEach(w => { if (w && !w.isDestroyed()) w.webContents.send('packs-changed'); });
}
ipcMain.handle('get-packs', () => readPacks());
ipcMain.handle('save-pack', (_e, pack) => {
  const id = String(pack.id || ('p' + Date.now().toString(36))).replace(/[^a-z0-9-]/gi, '');
  const b64 = String(pack.png || '').replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(path.join(packsDir(), id + '.png'), Buffer.from(b64, 'base64'));
  const meta = { id, name: pack.name || '내 동물', voice: pack.voice || 'other', breeds: pack.breeds || {}, created: Date.now() };
  fs.writeFileSync(path.join(packsDir(), id + '.json'), JSON.stringify(meta));
  notifyPacks();
  return id;
});
ipcMain.handle('delete-pack', (_e, id) => {
  const d = packsDir();
  let keys = [];
  try { keys = Object.keys(JSON.parse(fs.readFileSync(path.join(d, id + '.json'), 'utf8')).breeds || {}); } catch {}
  [id + '.json', id + '.png'].forEach(f => { try { fs.unlinkSync(path.join(d, f)); } catch {} });
  const before = settings.cats.length;
  settings.cats = settings.cats.filter(c => !keys.includes(c.breed));
  if (settings.cats.length !== before) { saveSettings(); broadcast(); }
  notifyPacks();
  return true;
});

// ---- 소리 파일 ----
// 1) 앱 안에 들어 있는 기본 소리 (cat1~5, dog1~5)
// 2) exe 옆 sounds 폴더에 같은 이름으로 넣으면 그 파일이 우선 (cat1_2.wav 처럼 여러 개면 그중 랜덤)
const SOUND_EXT = /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i;
const SOUND_GUIDE = '﻿' + [
  '[소리 파일 넣는 곳]',
  '이 폴더에 아래 이름으로 녹음 파일을 넣으면 앱에 들어 있는 소리 대신 이 파일이 나와요.',
  '  고양이: cat1.wav ~ cat5.wav   강아지: dog1.wav ~ dog5.wav',
  '  - mp3, wav, ogg, m4a 모두 돼요.',
  '  - 같은 번호로 여러 개 넣으면(cat1_2.wav ...) 매번 그중 하나를 골라 울어요.',
  '  - 1~2초 정도의 짧은 소리가 좋아요. 파일을 넣거나 지우면 바로 반영돼요.',
  '',
  '[Sound files]',
  'Put cat1-cat5 / dog1-dog5 (wav/mp3/ogg/m4a) here to replace the built-in sounds. Changes apply right away.'
].join('\r\n');
function exeDir() {
  if (PORTABLE_DIR) return PORTABLE_DIR;
  const bundled = process.resourcesPath && __dirname.startsWith(process.resourcesPath);
  return bundled ? path.dirname(process.execPath) : __dirname;
}
function userSoundDir(create) {
  const d = path.join(exeDir(), 'sounds');
  if (create) {
    try {
      fs.mkdirSync(d, { recursive: true });
      const guide = path.join(d, '읽어주세요_README.txt');
      if (!fs.existsSync(guide)) fs.writeFileSync(guide, SOUND_GUIDE);
    } catch (e) { console.error(e); }
  }
  return d;
}
function builtinSoundDir() {
  return path.join(__dirname, 'sounds').replace(/app\.asar(?=[\\/])/, 'app.asar.unpacked');
}
function scanSounds(d) {
  const out = { cat: [[], [], [], [], []], dog: [[], [], [], [], []] };
  let list = [];
  try { list = fs.readdirSync(d); } catch {}
  list.forEach(f => {
    if (!SOUND_EXT.test(f)) return;
    const m = /^(cat|dog)([1-5])(?:[_\- ].*)?\.[a-z0-9]+$/i.exec(f);
    if (!m) return;
    out[m[1].toLowerCase()][+m[2] - 1].push(pathToFileURL(path.join(d, f)).href);
  });
  return out;
}
function readSoundFiles() {
  const mine = scanSounds(userSoundDir(false));
  const base = scanSounds(builtinSoundDir());
  ['cat', 'dog'].forEach(k => { for (let i = 0; i < 5; i++) if (!mine[k][i].length) mine[k][i] = base[k][i]; });
  return mine;
}
let soundWatcher = null, soundTmr = null;
function watchSounds() {
  if (soundWatcher) return;
  const d = userSoundDir(false);
  if (!fs.existsSync(d)) return;
  try {
    soundWatcher = fs.watch(d, () => {
      clearTimeout(soundTmr);
      soundTmr = setTimeout(() => {
        [overlay, settingsWin].forEach(w => { if (w && !w.isDestroyed()) w.webContents.send('sounds-changed'); });
      }, 400);
    });
  } catch (e) { console.error(e); }
}
ipcMain.handle('get-sound-files', () => readSoundFiles());
ipcMain.on('open-sound-folder', () => { shell.openPath(userSoundDir(true)); watchSounds(); });
ipcMain.on('open-image-folder', () => shell.openPath(path.join(__dirname, 'assets')));

// ---- IPC ----
ipcMain.handle('get-state', () => ({ settings, display: displayInfo(targetDisplay()) }));

ipcMain.handle('get-displays', () => {
  const primary = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((d, i) => ({
    id: d.id,
    label: `${tx('mon')} ${i + 1} (${d.bounds.width}×${d.bounds.height})${d.id === primary ? ' · ' + tx('primary') : ''}`
  }));
});

ipcMain.on('save-settings', (_e, patch) => {
  const displayChanged = 'displayId' in patch && patch.displayId !== settings.displayId;
  settings = { ...settings, ...patch };
  if (displayChanged) settings.region = null;
  if ('autoStart' in patch) {
    try { app.setLoginItemSettings(PORTABLE_FILE ? { openAtLogin: !!settings.autoStart, path: PORTABLE_FILE } : { openAtLogin: !!settings.autoStart }); } catch {}
  }
  saveSettings();
  if (displayChanged) createOverlay();
  if ('lang' in patch) {
    if (tray) tray.setToolTip(tx('tip'));
    if (settingsWin && !settingsWin.isDestroyed()) settingsWin.setTitle(tx('title'));
  }
  broadcast();
});

ipcMain.on('set-ignore', (_e, ignore) => {
  if (!overlay || overlay.isDestroyed()) return;
  overlay.setIgnoreMouseEvents(!!ignore, { forward: true });
});

ipcMain.on('start-select-region', () => {
  if (!overlay || overlay.isDestroyed()) return;
  if (settingsWin && !settingsWin.isDestroyed()) settingsWin.hide();
  overlay.setIgnoreMouseEvents(false);
  overlay.setFocusable(true);
  overlay.focus();
  overlay.webContents.send('begin-select');
});

ipcMain.on('end-select-region', (_e, region) => {
  if (overlay && !overlay.isDestroyed()) {
    overlay.setFocusable(false);
    overlay.setIgnoreMouseEvents(true, { forward: true });
  }
  if (region) { settings.region = region; saveSettings(); }
  broadcast();
  openSettings();
});

ipcMain.on('open-settings', openSettings);
ipcMain.on('quit', () => app.quit());

// ---- 앱 시작 ----
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', openSettings);
  app.whenReady().then(() => {
    if (process.platform === 'darwin' && app.dock) app.dock.hide();
    loadSettings();
    createOverlay();
    createTray();
    watchSounds();
    screen.on('display-metrics-changed', () => { createOverlay(); });
    screen.on('display-removed', () => { createOverlay(); });
    // 처음 실행이면 설정 창을 보여줌
    if (!fs.existsSync(settingsPath)) { saveSettings(); openSettings(); }
  });
  app.on('window-all-closed', (e) => { /* 트레이에 계속 남아 있음 */ });
}
