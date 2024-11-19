const { ipcRenderer } = require('electron');

console.log('hello')

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