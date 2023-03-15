const {
  nativeImage,
  app,
  ipcMain,
  BrowserWindow,
  globalShortcut,
  Tray,
  Menu,
} = require("electron");
const path = require("path");

const { PythonShell } = require("python-shell");

// global shortcut keys
const Hide = "CommandOrControl+E";
let screenshot_name = null;
let screenshot_count = 1;

WIN = null;
Independent_Win = {};

console.log(`---------------------new----------`);

// -----------------------------------------------snipping tool
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const fade_in = async (window = null) => {
  if (window === null && !window.isDestroyed()) return;

  for (let i = 0.0; i <= 0.65; i += 0.05) {
    window.setOpacity(i);
    await sleep(20);
  }
};

const fade_out = async (window = null) => {
  if (window === null || window.isDestroyed()) return;

  for (let i = 0.65; i >= 0.0; i -= 0.05) {
    window.setOpacity(i);
    await sleep(20);
  }
};

const createWindow = () => {
  screenshot_count += 1;
  screenshot_name = `ScreenShot_${screenshot_count}`;

  const mainWindow = new BrowserWindow({
    resizable: false,
    movable: false,
    // fullscreen: true,
    // fullscreenable: true,
    // show: false,

    alwaysOnTop: true,
    frame: false,
    backgroundColor: "hsla(0, 0%, 10%, 1)",
    transparent: true,
    // opacity: .65,
    // opacity: 0.0,
    skipTaskbar: true,

    webPreferences: {
      preload: path.join(__dirname, "\\src\\preload\\main_preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  // mainWindow.on("closed", ()=>{
  // })

  mainWindow.loadFile("./src/html/main.html");
  // mainWindow.webContents.openDevTools({ mode: 'bottom' })
  // mainWindow.webContents.openDevTools()

  // mainWindow.setFullScreen(true)
  mainWindow.maximize();

  // clearTimeout()
  // setTimeout(()=>{
  //   mainWindow.restore()
  // }, 5000)

  return mainWindow;
};

// ----------------------------------------------------childwindow

// const imagePath = path.join(__dirname, 'path', 'to', 'image.png')
// const image = nativeImage.createFromPath(path_)

const childWindow_ = (window_data) => {
  // const createWindow = ()=>{

  const { _width_, _height_ } = window_data;

  // console.log(`screenShot is taken of width: ${_width_} and height: ${_height_}`)
  childWindow = new BrowserWindow({
    alwaysOnTop: true,
    width: _width_,
    height: _height_ + 60,

    webPreferences: {
      preload: path.join(__dirname, "\\src\\preload\\image_preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
      images: true,
      //--------- default: true
      // contextIsolation: true,
      // devTools: true,
      // javascript: true,
    },

    frame: false,
    backgroundColor: "hsla(0, 0%, 10%, 1)",
    resizable: false,
    movable: true,
    // transparent: true,
    // opacity: 0.90,
  });

  childWindow.loadFile("./src/html/image.html");
  // childWindow.webContents.openDevTools()

  //   ipcMain.on('close_btn', (e)=>{
  //   console.log("close")
  //   // app.quit()
  //   childWindow.close()
  //   // mainWindow.destroy()
  // })

  // ipcMain.on('min_btn', (e)=>{
  //   console.log("minimize")
  //   childWindow.minimize()
  //   childWindow.setFullScreen(false)
  // })

  // ipcMain.on('max_btn', (e)=>{
  //   if (childWindow.isMaximized())
  //   {
  //     // console.log("restore")
  //     childWindow.unmaximize()
  //   }
  //   else
  //   {
  //     // childWindow.setFullScreen(true)
  //     childWindow.maximize()
  //     // console.log("maximize")
  //   }

  //   // mainWindow.setSimpleFullScreen(true)
  //   // console.log(childWindow.isMaximized())
  // })

  childWindow.webContents.on("did-finish-load", () => {
    console.log("ready to load image");
    // childWindow.webContents.send('image-loaded', image.toDataURL())
    childWindow.webContents.send("image-loaded", window_data);
  });

  childWindow.on("closed", () => {
    console.log("window is closed");
  });
};

// -------------------------------app is ready

app.whenReady().then(() => {
  // Register a 'CommandOrControl+X' shortcut listener.
  const ret = globalShortcut.register(Hide, () => {
    console.log(`${Hide} is pressed`);

    if (WIN === null || WIN.isDestroyed()) {
      WIN = createWindow();
      fade_in(WIN);
      console.log("window is created");
    }
    // else if(!WIN.isVisible()){
    //   WIN.show()
    // }
  });

  if (!ret) {
    console.log("registration failed");
  }

  // Check whether a shortcut is registered.
  console.log(
    `globalShortcutkey [${Hide}]: ${
      globalShortcut.isRegistered(Hide) ? "is registered" : "is not registered"
    }`
  );

  //re-create a window when the dock icon is clicked and there are no other windows open
  app.on("activate", function () {
    console.log("window is activated");
    if (BrowserWindow.getAllWindows().length === 0) {
      WIN = createWindow();
    }
  });

  // ----------------------------system-tray
  const ico_path =
    "P:/PROGRAMMING/Projects/night projects/python projects/icons/Instagram.ico";
  // const ico = nativeImage.
  const tray = new Tray(ico_path);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", accelerator: Hide },
    { label: "Exit", role: "quit" },
  ]);

  tray.setToolTip("SnapShot 📸");
  tray.setTitle("manish");
  tray.setContextMenu(contextMenu);
});

// ------------------------------------------------window-all-closed

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    console.log("last window is quiting");
    console.log(BrowserWindow.getAllWindows.length);
    // app.quit()
  }
});

// ----------------------------------------will-quit

app.on("will-quit", () => {
  console.log("\n------------------saving everything---------");

  if (WIN !== null && !WIN.isDestroyed()) {
    console.log("window is still opened");
    WIN.close();
  }

  // Unregister a shortcut.
  console.log("unregistered key");
  globalShortcut.unregister(Hide);

  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});

// --------------------------------------------IPC

ipcMain.on("fade_out:", (event) => {
  console.log("fade out");
  // console.log(window)
  fade_out(WIN);
});

ipcMain.on("take_screenShot:", (event, window_details) => {
  console.log(`screenshot is taken`);

  screenshot_name = `Screenshot_${screenshot_count}.jpg`;
  const path_ = path.join(
    __dirname,
    `\\public\\Screenshots\\${screenshot_name}`
  );
  window_details["path_"] = path_;

  SCREENSHOT(window_details);

  console.log(`show image at ${path_}`);
  screenshot_count += 1;
});

const SCREENSHOT = (data) => {
  const { x1, y1, x2, y2, path_, _width_, _height_ } = data;
  console.log(`${x2 - x1} ${y2 - y1} width: ${_width_}, height: ${_height_}`);
  console.log(`path: ${path_}`);

  options = {
    // mode: 'text',
    // pyhtonPath: "P:\\PROJECT_VENV\\PYAUTO_GUI\\Scripts\\python.exe",
    pythonOptions: ["-u"],
    scriptPath: "./BackgroundProcess/",
    args: [x1, y1, x2, y2, path_],
  };

  const pyshell = new PythonShell("snapShot.py", options);

  // pyshell.on("message", (result)=>{
  //   console.log('result')
  // })

  pyshell.end(function (err) {
    if (err) throw err;
    console.log("finished");

    // show screenshot taken after taking

    childWindow_(data);
  });
};
