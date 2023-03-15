const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("image_action", {
  close: () => window.close(),
});

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, data) => ipcRenderer.send(channel, data),
});

ipcRenderer.on("image-loaded", (event, window_data) => {
  const { path_ } = window_data;
  const image = document.getElementById("img");

  image.setAttribute("src", path_);
});
