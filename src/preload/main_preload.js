const {
  contextBridge,
  BrowserWindow,
  ipcRenderer,
  remote,
} = require("electron");

contextBridge.exposeInMainWorld("action", {
  close_: () => {
    clearTimeout();

    console.log("going to close window in 450ms");

    ipcRenderer.send("fade_out:");
    // window.close();

    setTimeout(() => {
      window.close();
      console.log("window is closed...");
    }, 450);

    // ipcRenderer.send("close_mainWindow:")
  },
  // close: () => ipcRenderer.send('close_btn'),
  // max: () => ipcRenderer.send('max_btn'),
  take_screenShot: (window_details) => {
    console.log("taking screenshot");
    ipcRenderer.send("take_screenShot:", window_details);
  },
});
