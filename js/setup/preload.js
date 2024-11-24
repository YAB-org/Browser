const { ipcRenderer } = require('electron');

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