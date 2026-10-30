import { app, BrowserWindow, ipcMain, safeStorage, shell } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchJobs } from './jobs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const keyFile = () => path.join(app.getPath('userData'), 'gemini.key');

function openExternal(url) {
  try { if (new URL(url).protocol === 'https:') shell.openExternal(url); } catch { /* ignore bad URLs */ }
}

async function readKey() {
  try {
    const { result, shouldReEncrypt } = await safeStorage.decryptStringAsync(await fs.readFile(keyFile()));
    if (shouldReEncrypt) await fs.writeFile(keyFile(), await safeStorage.encryptStringAsync(result), { mode: 0o600 });
    return result;
  } catch {
    return null;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1180, height: 820, minWidth: 380, minHeight: 600,
    backgroundColor: '#fbf8f3', title: 'EasyBudget', show: false,
    webPreferences: {
      preload: path.join(here, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  win.once('ready-to-show', () => win.show());
  // The window only ever shows the app itself; links open in the normal browser (https only).
  win.webContents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); openExternal(url); } });
  win.loadFile(path.join(here, '..', 'dist', 'index.html'));
}

ipcMain.handle('key:status', async () => ({ saved: (await readKey()) !== null, secure: await safeStorage.isAsyncEncryptionAvailable() }));

ipcMain.handle('key:save', async (_e, key) => {
  if (typeof key !== 'string' || key.trim().length < 20 || key.length > 200) return { ok: false, error: "That doesn't look like a Gemini API key." };
  if (!(await safeStorage.isAsyncEncryptionAvailable())) return { ok: false, error: "Your system's secure storage isn't available, so the key was not saved." };
  await fs.writeFile(keyFile(), await safeStorage.encryptStringAsync(key.trim()), { mode: 0o600 });
  return { ok: true };
});

ipcMain.handle('key:clear', async () => { await fs.rm(keyFile(), { force: true }); });

ipcMain.handle('jobs:search', async (_e, req) => {
  const key = await readKey();
  if (!key) return { ok: false, error: 'NO_KEY' };
  return searchJobs(req && typeof req === 'object' ? req : {}, key);
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
