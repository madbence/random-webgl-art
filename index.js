const glm = require('gl-matrix');
const mat4 = glm.mat4;

const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl');
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.1, 0.1, 0.1, 1);

const config = {
  cx: 0,
  cy: -1,
  cz: -0.5,
  ox: 0,
  oy: 0,
  oz: 0,
  // t: 0,
  sx: 2,
  sy: 1,
  sz: 1,
  st: 15,
  // res: 30,
  fov: Math.PI / 4,
  // r: 2,
  e: 3,
  w: 3,
  f1: 10,
  f2: 17,
  f3: 23,
  f4: 10,
  f5: 20,
  f6: 20,
};

const limits = {
  t: [0, 10, 0.01],
  sx: [0, 5, 0.01],
  sy: [0, 5, 0.01],
  sz: [0, 5, 0.01],
  st: [0, 20, 0.01],
  res: [10, 100, 1],
  fov: [0, Math.PI, 0.01],
  r: [0.1, 10, 0.01],
  e: [1, 10, 0.01],
  w: [0, 10, 0.01],
  f1: [0, 50, 0.01],
  f2: [0, 50, 0.01],
  f3: [0, 50, 0.01],
  f4: [0, 50, 0.01],
  f5: [0, 50, 0.01],
  f6: [0, 50, 0.01],
  _d: [-2, 2, 0.01],
}

const vertex = `
precision mediump float;
attribute vec4 pos;
uniform mat4 view;
uniform float t, f1, f2, f3, f4, f5, f6, e, w;
uniform vec3 s;

float ripple(vec2 p0, vec2 p, float t) {
  float d = distance(p0, p);
  return sin(d * f5 + t / f6) * exp(-d * e);
}

vec3 f(vec2 pos, float t) {
  float r1 = ripple(vec2(sin(t/f1) * .5 + .5, cos(t/f1) * .5 + .5), pos, t) * .1;
  float r2 = ripple(vec2(-sin(t/f2 + 1.) * .3 + .5, cos(t/f2 + 1.) * .3 + .5), pos, t * 1.7 + 2.) * .1;
  float r3 = ripple(vec2(sin(t/f3 + 2.) * .4 + .5, cos(t/f3 + 2.) * .4 + .5), pos, t * 1.3 + 1.) * .1;
  return vec3(
    sin(pos.y * f4 + t) * w * .01,
    sin(pos.x * f4 + t) * w * .01,
    r1 + r2 + r3
  );
}

void main() {
  // gl_Position = view * vec4(pos + vec3(_x, _y, _z) - vec3(0.5, 0.5, 0), 1) * vec4(1, 1, 1, 1);
  vec4 offset = vec4(0.5, 0.5, 0, 1);
  gl_Position = view * (vec4(s.x, s.y, s.z, 1) * (pos - offset + vec4(f(pos.xy, t), 1)));
}
`;

const fragment = `
precision mediump float;

void main() {
  gl_FragColor = vec4(93./255., 199./255., 197./255., 1);
}
`;

const program = createProgram(gl, vertex, fragment);
gl.useProgram(program);
const pos = gl.getAttribLocation(program, 'pos');
const view = gl.getUniformLocation(program, 'view');
const t = gl.getUniformLocation(program, 't');
const f1l = gl.getUniformLocation(program, 'f1');
const f2l = gl.getUniformLocation(program, 'f2');
const f3l = gl.getUniformLocation(program, 'f3');
const f4l = gl.getUniformLocation(program, 'f4');
const f5l = gl.getUniformLocation(program, 'f5');
const f6l = gl.getUniformLocation(program, 'f6');
const el = gl.getUniformLocation(program, 'e');
const wl = gl.getUniformLocation(program, 'w');
const sl = gl.getUniformLocation(program, 's');

const RES = 100;
const R = RES + 1;
const vs = new Float32Array(R * R * 3);
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);

gl.enableVertexAttribArray(pos);

function f(x, y) {
  return [
    x,
    y,
    0,
  ];
}

function sim() {
  let k = 0;
  for (let i = 0; i <= RES; i++) {
    for (let j = 0; j <= RES; j++) {
      const x = j / RES;
      const y = i / RES;
      const p = f(x, y);
      vs[k++] = p[0];
      vs[k++] = p[1];
      vs[k++] = p[2];
    }
  }
}

sim();
const arr = new Float32Array(R * R * 3 * 1);

let k = 0;
for (let i = 0; i <= RES; i++) {
  for (let j = 0; j <= RES; j++) {
    arr[k++] = vs[(i * R + j) * 3 + 0];
    arr[k++] = vs[(i * R + j) * 3 + 1];
    arr[k++] = vs[(i * R + j) * 3 + 2];

    // arr[k++] = vs[(i * R + j + 1) * 3 + 0];
    // arr[k++] = vs[(i * R + j + 1) * 3 + 1];
    // arr[k++] = vs[(i * R + j + 1) * 3 + 2];

    // arr[k++] = vs[(i * R + j) * 3 + 0];
    // arr[k++] = vs[(i * R + j) * 3 + 1];
    // arr[k++] = vs[(i * R + j) * 3 + 2];

    // arr[k++] = vs[((i + 1) * R + j) * 3 + 0];
    // arr[k++] = vs[((i + 1) * R + j) * 3 + 1];
    // arr[k++] = vs[((i + 1) * R + j) * 3 + 2];
  }
}

gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 0, 0);

const s = Date.now();
function draw() {
  let now = (s - Date.now()) / 1000 * Math.PI * 2;
  gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
  const viewM = mat4.lookAt(mat4.create(), [
    config.cx,
    config.cy,
    config.cz
  ], [config.ox, config.oy, config.oz], [0, 0, -1]);
  mat4.mul(viewM, mat4.perspective(mat4.create(), config.fov, 1300 / 700 , 0.1, 100), viewM);
  // mat4.mul(viewM, mat4.ortho(mat4.create(), -0.5, 0.5, -0.5, 0.5, 0.1, 100), viewM);
  gl.uniformMatrix4fv(view, false, viewM);
  gl.uniform1f(t, now / config.st);
  gl.uniform1f(f1l, config.f1);
  gl.uniform1f(f2l, config.f2);
  gl.uniform1f(f3l, config.f3);
  gl.uniform1f(f4l, config.f4);
  gl.uniform1f(f5l, config.f5);
  gl.uniform1f(f6l, config.f6);
  gl.uniform1f(el, config.e);
  gl.uniform1f(wl, config.w);
  gl.uniform3fv(sl, [config.sx, config.sy, config.sz]);

  gl.drawArrays(gl.POINTS, 0, R * R * 1);

  requestAnimationFrame(draw);
}

Object.keys(config).forEach(function (key) {
  const control = document.createElement('div');

  control.innerHTML = key + ': <input step=' + ((limits[key] || limits._d)[2]) + ' type=range min=' + ((limits[key] || limits._d)[0]) + ' max=' + ((limits[key] || limits._d)[1]) + ' value=' + config[key] + ' /> <input type=number value=' +config[key] + ' />';
  control.querySelector('input[type="range"]').oninput = function (e) {
    control.querySelector('input[type="number"]').value = e.target.value;
    config[key] = +e.target.value;
  };
  control.querySelector('input[type="number"]').onchange = function (e) {
    control.querySelector('input[type="range"]').value = e.target.value;
    config[key] = +e.target.value;
  };
  document.body.appendChild(control);
});

requestAnimationFrame(draw);

function createShader(gl, source, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    throw new Error('Cannot compile shader: ' + gl.getShaderInfoLog(shader));
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, vertexSource, gl.VERTEX_SHADER);
  const fragmentShader = createShader(gl, fragmentSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const status = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!status) {
    throw new Error('Failed to link shaders: ' + get.getProgramInfoLog(program));
  }
  return program;
}
