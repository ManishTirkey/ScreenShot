const close_btn = document.getElementById("close_btn");
const btn = document.getElementsByClassName("btn");
const menus = document.getElementById("menus");
const btns = document.getElementById("btns");
const canvas = document.querySelector("#SCREEN");
const ctx = canvas.getContext("2d");

let restricted_X = null;
let restricted_X2 = null;
let restricted_h = null;

const childrens_len = btns.children.length;

let coord = { x: 0, y: 0 };
let paint = false;

let x1 = 0;
let y1 = 0;
let snapShot_taken = false;

for (let i = 1; i < childrens_len - 1; i++) {
  btns.children[i].style.margin = "0 2px";
}

// do this after window is loaded
window.addEventListener("load", () => {
  console.log("window is loaded");

  close_btn.addEventListener("click", close_);

  resize();
  document.addEventListener("mousedown", start);
  document.addEventListener("mouseup", stop);
  document.addEventListener("mousemove", sketch);
  window.addEventListener("resize", resize);
  window.addEventListener("reload", resize);

  restricted_area();
  menu_show();
});

// ------------------------restricted-area in pixels
const screen_ = screen.availWidth / 2;
const btn_w = btns.clientWidth / 2;

const restricted_area = () => {
  restricted_X = Math.ceil(screen_ - btn_w);
  restricted_X2 = Math.ceil(restricted_X + btns.clientWidth);
  restricted_h = btns.clientHeight;
};

// --------------------

const menu_hide = () => {
  menus.style.top = "-50px";
};

const menu_show = () => {
  menus.style.top = "0";
};

const close_ = (event) => {
  clearTimeout();
  if (!snapShot_taken) {
    setTimeout(() => {
      menu_hide();
    }, 50);
  }

  ipcRenderer.send("Close-MainWindow:");
  snapShot_taken = false;
};

// -------------drawing control------------

function resize() {
  ctx.canvas.width = window.innerWidth;
  ctx.canvas.height = window.innerHeight;
}

// returns event position : mousedown, mouseup, mousemove
function getPosition(event) {
  coord.x = event.clientX - canvas.offsetLeft;
  coord.y = event.clientY - canvas.offsetTop;
}

function start(event) {
  getPosition(event);
  x1 = coord.x;
  y1 = coord.y;

  if (y1 < restricted_h) if (x1 > restricted_X && x1 < restricted_X2) return;

  paint = true;

  clearTimeout();

  setTimeout(() => {
    menu_hide();
  }, 50);
}

function stop(event) {
  if (!paint) return;

  paint = false;
  getPosition(event);

  const X1 = Math.min(x1, coord.x);
  const Y1 = Math.min(y1, coord.y);
  const X2 = Math.max(x1, coord.x);
  const Y2 = Math.max(y1, coord.y);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  close_();

  clearTimeout();

  ipcRenderer.send("take_screenShot:", {
    _width_: X2 - X1,
    _height_: Y2 - Y1,
    x1: X1,
    y1: Y1,
    x2: X2,
    y2: Y2,
  });

  snapShot_taken = true;
}

function sketch(event) {
  if (!paint) return;

  const width = coord.x - x1;
  const height = coord.y - y1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "white";
  getPosition(event);
  ctx.strokeRect(x1, y1, width, height);
}
