const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const userDataPath = app.getPath("userData")

// Remove menu bar
Menu.setApplicationMenu(null);

// Create browser window
function createWindow() {
  // Check if first use
  const first_use = !fs.existsSync(path.join(userDataPath, 'user-data.json'));

  const win = new BrowserWindow({
    title: 'YAB',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, 'js', (first_use ? 'setup' : 'index'), 'preload.js')
    }
  })

  win.maximize();
  // Doesn't seem to work
  // TODO: Remove traffic lights in macos
  //win.setWindowButtonVisibility(false)

  if (first_use) {
    // Setup
    win.loadFile('pages/setup.html');
  } else {
    // Open normal browser
    win.loadFile('pages/index.html');
  }
  win.webContents.openDevTools();

  win.show();
}

app.whenReady().then(() => {
  ipcMain.on('window-action', (event, data) => {
    let win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    switch(data.action) {
      case 'minimize':
        win.minimize();
        break;
      case 'maximize':
        if (win.isMaximized()) {
          win.unmaximize();
        } else {
          win.maximize();
        }
        break;
      case 'close':
        win.close();
        break;
      default:
        // Invalid action
        break;
    }
  });

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})