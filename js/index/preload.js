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

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, ...args) => electron.ipcRenderer.send(channel, ...args),
  on: (channel, callback) => electron.ipcRenderer.on(channel, callback)
});

contextBridge.exposeInMainWorld('closeApp', {
  close: () => {
      ipcRenderer.send('close-request');
  }
});