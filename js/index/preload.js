const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', function(){
  document.getElementById('winConMinimize').onclick = function() {
    ipcRenderer.send('window-action', { action: "minimize" });
  };
  document.getElementById('winConMaximize').onclick = function() {
    ipcRenderer.send('window-action', { action: "maximize" });
  };
  document.getElementById('winConClose').onclick = function() {
    ipcRenderer.send('window-action', { action: "close" });
  };
})

ipcRenderer.on('window-state', (event, data) => {
  document.getElementById('winConMaximize').innerHTML = `<sample name="windows_maximize${data.maximized ? 'd' : ''}_svg"></sample>`;
});

contextBridge.exposeInMainWorld('backend', {
  getWindowData: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('window-action', { action: 'getwindowdata' })
      ipcRenderer.once('window-data', (sender, data)=>{
        resolve(data)
      })
    })
  }
});


contextBridge.exposeInMainWorld('process', {
  spawn: async () => {
    const pid = await ipcRenderer.invoke('spawn-process');
    return pid;
  },
  terminate: (pid) => ipcRenderer.send('terminate-process', pid),
  kill: (pid) => ipcRenderer.send('kill-process', pid),
  resetProcess: (pid) => ipcRenderer.send('reset-process', pid),

  executeLua: (pid, lua, api) => ipcRenderer.send('execute-lua', pid, lua, api),
});

// Main -> Renderer
contextBridge.exposeInMainWorld('main', {
  onMessage: (channel, callback) => {
    const validChannels = ['process-unexpected-terminated'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, data) => callback(data));
    }
  }
});
contextBridge.exposeInMainWorld('closeApp', {
  close: () => {
      ipcRenderer.send('close-request');
  }
});