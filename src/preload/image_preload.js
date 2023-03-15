const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("image_action", {
  close: () => {
    window.close();
  },
  // close: () => ipcRenderer.send('close_btn'),
  // max: () => ipcRenderer.send('max_btn'),

  LoadImg: (path = "jhel") => {
    // const image = document.getElementById('img')
    // image.setAttribute('src', path)
    console.log(`path is: ${path}`);
  },
});

ipcRenderer.on("image-loaded", (event, window_data) => {
  const { path_, _width_, _height_ } = window_data;

  // const image_wrapper = document.getElementById("image_wrapper");
  const image = document.getElementById("img");

  // image_wrapper.setAttribute("width", _width_);
  // image_wrapper.setAttribute("height", _height_);

  console.log("path is: ");
  console.log(path_);
  image.setAttribute("src", path_);
});
