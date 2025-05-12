const {
  app,
  ipcMain,
  BrowserWindow,
  globalShortcut,
  Tray,
  Menu,
} = require("electron");
const { dialog } = require("electron");

const path = require("path");
const { spawn } = require("child_process");
const { PythonShell } = require("python-shell");

const { v4: uuidv4 } = require("uuid");

// global shortcut keys
const Hide = "CommandOrControl+E";

let screenshot_name = null;
let screenshot_count = 1;

let mainWindow = null;
let childWindow = null;
let animate_speed = 0.01;

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
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("./src/html/main.html");
  mainWindow.maximize();

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    let opacity = 0;
    const max_opacity = 0.6;

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
  const { _width_, _height_, path_ } = window_data;

  // Check if file exists before proceeding
  const fs = require("fs");
  if (!fs.existsSync(path_)) {
    dialog.showErrorBox("Error", `Screenshot file not found at: ${path_}`);
    return;
  }

  childWindow = new BrowserWindow({
    alwaysOnTop: true,
    width: _width_,
    height: _height_ + 50,
    icon: "./public/tray.ico",

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

  childWindow.loadFile(path.join(__dirname, "src/html/image.html"));

  childWindow.webContents.on("did-finish-load", () => {
    // Add debugging
    childWindow.webContents.send("image-loaded", window_data);
  });

  childWindow.on("closed", async () => {
    childWindow = null;
    const { path_ } = window_data;
    await fs.promises.unlink(path_);
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

  if (!ret) {
    console.error("registration failed");
  }

  // Check whether a shortcut is registered.
  console.info(
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

ipcMain.on("take_screenShot:", async (event, window_details) => {
  screenshot_name = `${uuidv4()}.png`;

  const screenshot_path = path.join(app.getPath("temp"), screenshot_name);
  window_details["path_"] = screenshot_path;

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

  // Fix path resolution for packaged app
  let exePath;
  if (app.isPackaged) {
    exePath = path.join(process.resourcesPath, "BackgroundProcess");
  } else {
    exePath = path.join(__dirname, "BackgroundProcess");
  }

  // Ensure Screenshots directory exists
  const screenshotsDir = path.dirname(path_);
  const fs = require("fs");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // -----------------------spawn

  const pythonExePath = path.join(exePath, "snapShot.exe");
  const args = [x1, y1, x2, y2, path_];

  const pythonProcess = spawn(pythonExePath, args);

  // pythonProcess.stdout.on('data', (data) => {
  //   console.log(`Python stdout: ${data}`);
  // });

  // pythonProcess.stderr.on('data', (data) => {
  //   console.error(`Python stderr: ${data}`);
  // });

  pythonProcess.on("error", (error) => {
    console.error(`Failed to start Python process: ${error}`);
    dialog.showErrorBox(
      "Error",
      `Failed to start Python process: ${error.message}`
    );
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      // Verify file exists before creating child window
      if (fs.existsSync(path_)) {
        create_childWindow_(data);
      } else {
        dialog.showErrorBox("Error", `Error on Path ${path_}`);
      }
    } else {
      dialog.showErrorBox("Error", `Python process exited with code ${code}`);
    }
  });
};
