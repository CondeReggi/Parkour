import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { registerHandlers } from './ipc/registerHandlers'
import { disconnectPrisma } from './db/client'
import {
  registerParkourMediaPrivileges,
  registerParkourMediaProtocol
} from './protocol/parkourMedia'

// Forzamos el nombre de la app antes de cualquier acceso a userData,
// para que app.getPath('userData') resuelva al mismo directorio que
// scripts/with-db-env.mjs (donde corre la migración y el seed).
app.setName('parkour-app')

// Los privilegios del scheme deben declararse antes de app.whenReady().
registerParkourMediaPrivileges()

const isDev = !app.isPackaged

function createMainWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#09090b',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

void app.whenReady().then(() => {
  registerParkourMediaProtocol()
  registerHandlers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  void disconnectPrisma()
})
