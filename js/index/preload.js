const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('backend', {
  getMouse: () => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('window-action', { action: 'getmouse' })
      ipcRenderer.once('window-mouse', (sender, data)=>{
        resolve(data)
      })
    })
  }
});