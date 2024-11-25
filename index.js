const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const userDataPath = app.getPath("userData")

// Remove menu bar
Menu.setApplicationMenu(null);

// Create browser window
function createWindow() {
  // Check if first use
  let first_use = !fs.existsSync(path.join(userDataPath, 'user-data.json'));
  first_use = false;
  let primaryDisplay = screen.getPrimaryDisplay();
  let { width, height } = primaryDisplay.workAreaSize;

  const win = new BrowserWindow({
    title: 'YAB',
    show: false,
    width: Math.floor(width * (first_use ? 0.5 : 0.7)),
    height: Math.floor(height * (first_use ? 0.6 : 0.8)),
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, 'js', (first_use ? 'setup' : 'index'), 'preload.js')
    }
  })

  // if (!first_use) win.maximize();

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

  function sendState() {
    win.webContents.send('window-state', { maximized: win.isMaximized() });
  }
  win.on('maximize', sendState);
  win.on('unmaximize', sendState);

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
      case 'getwindowdata':
        win.webContents.send('window-data', {
          mouse: screen.getCursorScreenPoint(),
          bounds: win.getBounds()
        });
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