'use strict';

const glm = require('gl-matrix');
const mat4 = glm.mat4;

const config = {
  cx: 0,
  cy: -1,
  cz: -0.5,
  ox: 0,
  oy: 0,
  oz: 0,
  t: 0,
  sx: 2,
  sy: 1,
  sz: 1,
  res: 30,
  fov: Math.PI / 3,
  r: 2
};

const limits = {
  t: [0, 10, 0.01],
  sx: [0, 5, 0.01],
  sy: [0, 5, 0.01],
  sz: [0, 5, 0.01],
  res: [10, 100, 1],
  fov: [0, Math.PI, 0.01],
  r: [0.1, 10, 0.01],
  _d: [-2, 2, 0.01],
}

Object.keys(config).forEach(function (key) {
  const control = document.createElement('div');

  control.innerHTML = key + ': <input step=' + ((limits[key] || limits._d)[2]) + ' type=range min=' + ((limits[key] || limits._d)[0]) + ' max=' + ((limits[key] || limits._d)[1]) + ' value=' + config[key] + ' /> <input type=number value=' +config[key] + ' />';
  control.querySelector('input[type="range"]').oninput = function (e) {
    control.querySelector('input[type="number"]').value = e.target.value;
    config[key] = +e.target.value;
    draw();
  };
  control.querySelector('input[type="number"]').onchange = function (e) {
    control.querySelector('input[type="range"]').value = e.target.value;
    config[key] = +e.target.value;
    draw();
  };
  document.body.appendChild(control);
});

glm.vec3.transformMat4 = function(out, a, m) {
  var x = a[0], y = a[1], z = a[2],
    w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
};

function distance(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function ripple(p0, p, t) {
  const d = distance(p0, p);
  return Math.sin(d * 20. + t / 5.) * Math.exp(-d * 3.);
}

function fo(pos, t) {
  const sin = Math.sin;
  const cos = Math.cos;
  const r1 = ripple([sin(t/10.) * .5 + .5, cos(t/10.) * .5 + .5], pos, t) * .1;
  const r2 = ripple([-sin(t/17. + 1.) * .3 + .5, cos(t/17. + 1.) * .3 + .5], pos, t * 1.7 + 2.) * .1;
  const r3 = ripple([sin(t/23. + 2.) * .4 + .5, cos(t/23. + 2.) * .4 + .5], pos, t * 1.3 + 1.) * .1;
  return [
    sin(pos[1] * 10. + t) * .03,
    sin(pos[0] * 10. + t) * .03,
    r1 + r2 + r3
  ];
}

function f(x, y, t) {
  const p = fo([x, y], t);
  return [
    x + p[0] - 0.5,
    y + p[1] - 0.5,
    p[2],
  ];
}

const s = Date.now();
function draw() {
  let now = (s - Date.now()) / 1000 * Math.PI * 2 / 10;
  const RES = config.res;
  const R = RES + 1;
  const vs = new Float32Array(R * R * 3);

  sim(config.t);
  function sim(t) {
    let k = 0;
    for (let i = 0; i <= RES; i++) {
      for (let j = 0; j <= RES; j++) {
        const x = j / RES;
        const y = i / RES;
        const p = f(x, y, t);
        vs[k++] = p[0];
        vs[k++] = p[1];
        vs[k++] = p[2];
      }
    }
  }

  const arr = new Float32Array(R * R * 3 * 1);

  const viewM = mat4.lookAt(mat4.create(), [
    config.cx,
    config.cy,
    config.cz,
  ], [config.ox, config.oy, config.oz], [0, 0, -1]);
  mat4.mul(viewM, mat4.perspective(mat4.create(), config.fov, 1, 0.1, 100), viewM);

  let k = 0;
  for (let i = 0; i <= RES; i++) {
    for (let j = 0; j <= RES; j++) {
      const v = glm.vec3.fromValues(vs[(i * R + j) * 3 + 0], vs[(i * R + j) * 3 + 1], vs[(i * R + j) * 3 + 2]);
      const tv = glm.vec3.create();
      glm.vec3.transformMat4(tv, glm.vec3.mul(tv, v, glm.vec3.fromValues(config.sx, config.sy, config.sz)), viewM);
      arr[k++] = tv[0];
      arr[k++] = tv[1];
      arr[k++] = tv[2];
    }
  }

  let content = '';

  function append(s) {
    content += s;
  }

  append('<svg viewBox="-1 -1 2 2" version="1.1" xmlns="http://www.w3.org/2000/svg">');
  for (let i = 0; i < R * R; i++) {
    append(`<circle cx="${arr[i * 3]}" cy="${-arr[i * 3 + 1]}" r="${config.r * 0.001}" />`);
  }
  append('</svg>');

  document.getElementById('svg').innerHTML = content;
  document.getElementById('download').href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(content);
}

draw();
