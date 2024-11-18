const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const userDataPath = app.getPath("userData")

// Remove menu abr
Menu.setApplicationMenu(null);

console.log(path.join(userDataPath, 'user-data.json'))

function createWindow() {
  // Create browser window
  const win = new BrowserWindow({
    title: 'YAB',
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: true,
    webPreferences: {
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.maximize();

  // Check if first use
  if (fs.existsSync(path.join(userDataPath, 'user-data.json'))) {
    // Open normal browser
    win.loadFile('pages/index.html');
  } else {
    // Setup
    win.loadFile('pages/setup.html');
  }

  win.show();
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})