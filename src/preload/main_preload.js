const { contextBridge, BrowserWindow, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ipcRenderer", {
  // on: (channel, func)=> ipcRenderer.on(channel, (...args) => func(...args)),
  invoke: (channel) => ipcRenderer.invoke(channel),
  send: (channel, data) => ipcRenderer.send(channel, data),
});
