bounds = {
  'cx': 0,
  'cy': 0,
  'area': 100
};

function getMatrix() {
  return [11, 12, 13, 21, 22, 23, 31, 32, 33].map(
    (val) => +document.getElementById("m" + val).value || 0
  );
}

function loadIdentity() {
  [11, 12, 13, 21, 22, 23, 31, 32, 33].map(
    function (val) {
      document.getElementById("m" + val).value =
        +(val % 11 == 0);
    }
  );
}

function xyTransform(mat, x, y) {
  var xp = mat[0] * x + mat[1] * y + mat[2];
  var yp = mat[3] * x + mat[4] * y + mat[5];
  var zp = mat[6] * x + mat[7] * y + mat[8];
  return [xp / zp, yp / zp];
}

function determinant(a, b, c, d, e, f, g, h, i) {
  return (a * e * i) + (b * f * g) + (c * d * h) -
    (c * e * g) - (b * d * i) - (a * f * h);
}

function xyInvert(mat, x, y) {
  // Use Cramer's rule.
  // var divisor = determinant.apply(null, mat);
  var xnum = determinant(
    x, mat[1], mat[2],
    y, mat[4], mat[5],
    1, mat[7], mat[8]
  );
  var ynum = determinant(
    mat[0], x, mat[2],
    mat[3], y, mat[5],
    mat[6], 1, mat[8]
  );
  var znum = determinant(
    mat[0], mat[1], x,
    mat[3], mat[4], y,
    mat[6], mat[7], 1
  );
  return [xnum / znum, ynum / znum];
}

function drawLine(ctx, x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function updateWindowBounds() {
  var ar = canvas.width / canvas.height;
  var h = Math.sqrt(bounds.area / ar);
  var w = bounds.area / h;
  bounds.xmin = bounds.cx - w / 2;
  bounds.xmax = bounds.cx + w / 2;
  bounds.ymin = bounds.cy - h / 2;
  bounds.ymax = bounds.cy + h / 2;
}

function xyPlaneToCanvas(x, y) {
  xprog = (x - bounds.xmin) / (bounds.xmax - bounds.xmin);
  yprog = (y - bounds.ymin) / (bounds.ymax - bounds.ymin);
  return [xprog * canvas.width, (1 - yprog) * canvas.height];
}

function drawAxes() {
  ctx.strokeStyle = "black";
  [cx0, cy0] = xyPlaneToCanvas(0, 0);
  drawLine(ctx, 0, cy0, canvas.width, cy0);
  drawLine(ctx, cx0, 0, cx0, canvas.height);
}

// in terms of untransformed plane coordinates
function getDrawBounds() {
  var mat = getMatrix();
  var [x1, y1] = xyInvert(mat, bounds.xmin, bounds.ymin);
  var [x2, y2] = xyInvert(mat, bounds.xmin, bounds.ymax);
  var [x3, y3] = xyInvert(mat, bounds.xmax, bounds.ymin);
  var [x4, y4] = xyInvert(mat, bounds.xmax, bounds.ymax);
  return [
    Math.min(x1, x2, x3, x4),
    Math.max(x1, x2, x3, x4),
    Math.min(y1, y2, y3, y4),
    Math.max(y1, y2, y3, y4)
  ].map((x) => isFinite(x) ? x : 0);
}

function drawPoints() {
  var [xmin, xmax, ymin, ymax] = getDrawBounds();
  var mat = getMatrix();
  for (var x = Math.ceil(xmin); x <= xmax; ++x) {
    for (var y = Math.ceil(ymin); y <= ymax; ++y) {
      var red = 255 - 50 * Math.abs(x);
      var blue = 255 - 25 * Math.abs(y);
      ctx.fillStyle = `rgb(${red}, 0, ${blue})`;
      var [xp, yp] = xyTransform(mat, x, y);
      var [xc, yc] = xyPlaneToCanvas(xp, yp);
      ctx.fillRect(xc - 2, yc - 2, 4, 4);
    }
  }
  ctx.strokeStyle = "red";
  ctx.globalAlpha = 0.2;
  // x-gridlines
  for (var y = Math.ceil(ymin); y <= ymax; ++y) {
    var [xp1, yp1] = xyTransform(mat, xmin, y);
    var [xc1, yc1] = xyPlaneToCanvas(xp1, yp1);
    var [xp2, yp2] = xyTransform(mat, xmax, y);
    var [xc2, yc2] = xyPlaneToCanvas(xp2, yp2);
    drawLine(ctx, xc1, yc1, xc2, yc2);
  }
  // y-gridlines
  ctx.strokeStyle = "blue";
  for (var x = Math.ceil(xmin); x <= xmax; ++x) {
    var [xp1, yp1] = xyTransform(mat, x, ymin);
    var [xc1, yc1] = xyPlaneToCanvas(xp1, yp1);
    var [xp2, yp2] = xyTransform(mat, x, ymax);
    var [xc2, yc2] = xyPlaneToCanvas(xp2, yp2);
    drawLine(ctx, xc1, yc1, xc2, yc2);
  }
  ctx.globalAlpha = 1;
}

function refresh() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateWindowBounds();
  drawAxes();
  drawPoints();
}

document.addEventListener("DOMContentLoaded", function() {
  [11, 12, 13, 21, 22, 23, 31, 32, 33].map(
    function (val) {
      var node = document.getElementById("m" + val);
      node.addEventListener("input", function (e) {
        refresh();
      });
    }
  );
  loadIdentity();
  canvas = document.getElementById("viz");
  var rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height - 100;
  ctx = canvas.getContext("2d");
  refresh();
});

window.addEventListener("resize", function() {
  var rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height - 100;
  refresh();
})