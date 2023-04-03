const {
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

let mainWindow = null;
let childWindow = null;
let animate_speed = 0.01;

console.log(`---------------------new----------`);

// -----------------------------------------------snipping tool

const createWindow = () => {
  mainWindow = new BrowserWindow({
    resizable: false,
    movable: false,
    alwaysOnTop: true,

    backgroundColor: "hsla(0, 0%, 10%, 1)",

    show: false,
    transparent: true,
    frame: false,
    opacity: 0,
    skipTaskbar: true,

    webPreferences: {
      preload: path.join(__dirname, "\\src\\preload\\main_preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("./src/html/main.html");
  mainWindow.maximize();

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    let opacity = 0;
    const max_opacity = 0.5;

    const interval = setInterval(() => {
      opacity += animate_speed;
      if (opacity >= max_opacity) {
        clearInterval(interval);
      }

      mainWindow.setOpacity(opacity);
    }, 10);
  });

  mainWindow.on("close", (event) => {
    event.preventDefault();
    Close_Window();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// ----------------------------------------------------childwindow

const create_childWindow_ = (window_data) => {
  const { _width_, _height_ } = window_data;

  childWindow = new BrowserWindow({
    alwaysOnTop: true,
    width: _width_,
    height: _height_ + 50,

    webPreferences: {
      preload: path.join(__dirname, "\\src\\preload\\image_preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },

    frame: false,
    backgroundColor: "hsla(0, 0%, 10%, 1)",
    resizable: true,
    movable: true,
  });

  childWindow.loadFile("./src/html/image.html");

  childWindow.webContents.on("did-finish-load", () => {
    childWindow.webContents.send("image-loaded", window_data);
  });

  childWindow.on("closed", () => {
    childWindow = null;
  });
};

// ---------------------------------------------app-events
// -------------------------------app is ready

app.on("browser-window-focus", () => {
  childWindow = BrowserWindow.getFocusedWindow();
});

app.whenReady().then(() => {
  // Register a 'CommandOrControl+X' shortcut listener.
  const ret = globalShortcut.register(Hide, () => {
    if (mainWindow == null) createWindow();
  });

  // if (!ret) {
  //   console.log("registration failed");
  // }

  // Check whether a shortcut is registered.
  console.log(
    `globalShortcutkey [${Hide}]: ${
      globalShortcut.isRegistered(Hide) ? "is registered" : "is not registered"
    }`
  );

  //re-create a window when the dock icon is clicked and there are no other windows open
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // ----------------------------system-tray

  const tray = new Tray(path.join(__dirname, "\\public\\tray.ico"));

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show", accelerator: Hide },
    { label: "Exit", role: "quit" },
  ]);

  tray.setToolTip("SnapShot 📸");
  tray.setTitle("manish");
  tray.setContextMenu(contextMenu);
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    // app.quit()
  }
});

// ------------------will-quit

app.on("will-quit", () => {
  // Unregister a shortcut.
  globalShortcut.unregister(Hide);

  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});

// --------------------------------------------IPC - mainWindow
ipcMain.on("Close-MainWindow:", () => {
  Close_Window();
});

ipcMain.on("take_screenShot:", (event, window_details) => {
  screenshot_name = `Screenshot_${screenshot_count}.jpg`;
  const path_ = path.join(
    __dirname,
    `\\public\\Screenshots\\${screenshot_name}`
  );
  window_details["path_"] = path_;

  SCREENSHOT(window_details);
});

// --------------------------------------------IPC - childWindow

ipcMain.on("Maximize:child", () => {
  if (!childWindow.isMaximized()) {
    childWindow.maximize();
  } else {
    childWindow.restore();
  }
});

ipcMain.on("Minimize:child", () => {
  childWindow.minimize();
});

// ----------------------------------------------functions
function wait(ms) {
  const start = new Date().getTime();
  while (new Date().getTime() - start < ms) {}
}

const Close_Window = () => {
  let opacity = mainWindow.getOpacity();
  const min_opacity = 0;

  for (let i = opacity - animate_speed; i >= min_opacity; i -= animate_speed) {
    mainWindow.setOpacity(i);
    wait(10);
  }

  mainWindow.destroy();
};

const SCREENSHOT = (data) => {
  const { x1, y1, x2, y2, path_ } = data;

  options = {
    // mode: 'text',
    pythonOptions: ["-u"],
    scriptPath: "./BackgroundProcess/",
    args: [x1, y1, x2, y2, path_],
  };

  const pyshell = new PythonShell("snapShot.py", options);

  pyshell.end(function (err) {
    if (err) throw err;

    // show screenshot taken after taking
    create_childWindow_(data);
    screenshot_count += 1;
  });
};
