const cl = document.getElementById("close_btn");
const min = document.getElementById("min_btn");
const max = document.getElementById("max_btn");

const img = document.getElementById("image");

let scale = 1;
let panning = false;
let pointX = 0;
let pointY = 0;
let start = { x: 0, y: 0 };

window.addEventListener("load", () => {
  cl.addEventListener("click", close);
  min.addEventListener("click", minimize);
  max.addEventListener("click", maximize);

  // load_img()
});

// ---------titlebar-----------

const close = (event) => {
  window.image_action.close();
};

const minimize = (event) => {
  // window.image_action.min()
};

const maximize = (event) => {
  // window.image_action.max()
};

// ----------------------

const zoom = img;

function setTransform() {
  zoom.style.transform =
    "translate(" + pointX + "px, " + pointY + "px) scale(" + scale + ")";
}

zoom.onmousedown = function (e) {
  e.preventDefault();
  start = { x: e.clientX - pointX, y: e.clientY - pointY };
  panning = true;
  zoom.style.cursor = "grabbing";
};

zoom.onmouseup = function (e) {
  panning = false;
  zoom.style.cursor = "grab";
};

zoom.onmousemove = function (e) {
  e.preventDefault();
  if (!panning) {
    return;
  }
  pointX = e.clientX - start.x;
  pointY = e.clientY - start.y;
  setTransform();
};

zoom.onwheel = function (e) {
  e.preventDefault();
  let xs = (e.clientX - pointX) / scale;
  let ys = (e.clientY - pointY) / scale;
  let delta;
  delta = e.wheelDelta ? e.wheelDelta : -e.deltaY;
  delta > 0 ? (scale *= 1.2) : (scale /= 1.2);
  pointX = e.clientX - xs * scale;
  pointY = e.clientY - ys * scale;

  setTransform();
};
