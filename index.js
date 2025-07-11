const {app, BrowserWindow, ipcMain, Menu, screen, utilityProcess, session} = require('electron');
const { autoUpdater } = require("electron-updater");
const path = require('node:path');
const fs = require('node:fs');
const userDataPath = app.getPath("userData");
const childProcess = require('child_process');


// Remove menu bar
Menu.setApplicationMenu(null);

// Create browser window

let splashWindow;

function createSplashWindow() {
	splashWindow = new BrowserWindow({
		width: 880,
		height: 560,
		frame: false,
		transparent: true,
		resizable: false,
		//alwaysOnTop: true
  });
  splashWindow.loadFile("pages/splash.html");
}

function createBrowserWindow() {
	// Check if first use
	let first_use = !fs.existsSync(path.join(userDataPath, 'user-data.json'));
	first_use = false;
	let primaryDisplay = screen.getPrimaryDisplay();
	let {
		width,
		height
	} = primaryDisplay.workAreaSize;

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

	if (!first_use) win.maximize();
	// TODO: Remove traffic lights in macos
	//win.setWindowButtonVisibility(false)

	if (first_use) {
		// Setup Screen
		win.loadFile('pages/setup.html');
	} else {
		// Open normal browser
		win.loadFile('pages/index.html');
	}
	win.webContents.openDevTools();

	function sendState() {
		win.webContents.send('window-state', {
			maximized: win.isMaximized()
		});
	}
	win.on('maximize', sendState);
	win.on('unmaximize', sendState);
  win.show();

	session.defaultSession.on('will-download', async (event, item) => {
		const fileName = item.getFilename();
		const filePath = path.join(app.getPath('downloads'), fileName);
		item.setSavePath(filePath);

		const tempExt = path.extname(fileName);
    	const tempPath = path.join(app.getPath('temp'), `temp_icon${tempExt}`);
		try {
			fs.writeFileSync(tempPath, '');
			const icon = await app.getFileIcon(tempPath, { size:'large' });
			// send icon to main
			fs.unlinkSync(tempPath);
		} catch (err) {
			// cant get icon put a placeholder or nothing
		}

	})
  app.on('child-process-gone', (event, details) => {
	console.log(`Child process of type ${details.type} with name ${details.name} and service name ${details.serviceName} has exited.`);
	console.log(`Reason: ${details.reason}, Exit Code: ${details.exitCode}`);
	win.webContents.send('process-unexpected-terminated', { pid: details.name });
  }); 
}

app.whenReady().then(() => {

	createSplashWindow()
	autoUpdater.checkForUpdates();
	setTimeout(() => {
		splashWindow.hide();
		setTimeout(() => {
			createBrowserWindow();
			splashWindow.destroy();
		}, 1000);
	}, 3000);
	
	autoUpdater.on("checking-for-update", () => {
		console.log("checking for updates");
		splashWindow.destroy();
		createBrowserWindow()
  	});
	autoUpdater.on("update-not-available", (info) => {
		console.log("not available");
		createBrowserWindow()
	});

	autoUpdater.on("error", (err) => {
		//splashWindow.webContents.send("update-status", `Error: ${err.message}`);
		console.log("error occurred", err.message)
		createBrowserWindow()
	});

	ipcMain.on('window-action', (event, data) => {
		let win = BrowserWindow.fromWebContents(event.sender);
		if (!win) return;
		switch (data.action) {
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

	
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('close-request', () => {
	app.quit();
});


// SUBPROCESSES

// Store child processes with custom PIDs
const subprocesses = {};

// generate pid
function generateUniquePid() {
	let pid;
	do {
	  pid = Math.floor(10000000 + Math.random() * 9000000).toString();
	} while (subprocesses[pid]);
	return pid;
}

// spawning
ipcMain.handle('spawn-process', async (event) => {
	const pid = generateUniquePid();
	const child = utilityProcess.fork(path.join(__dirname, 'subwasmoon.js'), [], {
	serviceName: pid,
	stdio: 'pipe'
  });

	subprocesses[pid] = child;
	child.on('spawn', () => {
		console.log("spawned process with fpid: " + pid + " and tpid: " + child.pid) // Integer
	});
	child.on('error', (error) => {
		console.error('Utility process encountered an error:', error);
	});
	child.stdout.on('data', (data) => {
        console.log(`Utility stdout: ${data.toString()}`);
    });
    child.stderr.on('data', (data) => {
        console.error(`Utility stderr: ${data.toString()}`);
    });
	return pid;
});

ipcMain.on('terminate-process', (event, pid) => {
	const child = subprocesses[pid];
	child.kill();
});

ipcMain.on('kill-process', (event, pid) => {
	const child = subprocesses[pid];
	child.kill();
});

ipcMain.on('reset-process', (event, pid) => {
	const old_child = subprocesses[pid];
	console.log(subprocesses[pid]);
	old_child.kill();
	const new_child = utilityProcess.fork(path.join(__dirname, 'sub_wasmoon.js'), [], {
		serviceName: pid.toString()
	  });
	subprocesses[pid] = new_child;
	
	  new_child.on('spawn', () => {
		console.log("Reset process " + pid + " with new tpid: " + new_child.pid) // Integer
	})
})

ipcMain.on("execute-lua", (event, pid, lua, api) => {
	console.log('Execute Lua for PID:', pid);
  	console.log(`Lua Code: with api ${api}`, lua);
})