const glm = require('gl-matrix');
const mat4 = glm.mat4;

const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl');
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.1, 0.1, 0.1, 1);

const vertex = `
precision mediump float;
attribute vec4 pos;
uniform mat4 view;
uniform float t;

float ripple(vec2 p0, vec2 p, float t) {
  float d = distance(p0, p);
  return sin(d * 20. + t / 5.) * exp(-d * 3.);
}

vec3 f(vec2 pos, float t) {
  float r1 = ripple(vec2(sin(t/10.) * .5 + .5, cos(t/10.) * .5 + .5), pos, t) * .1;
  float r2 = ripple(vec2(-sin(t/17. + 1.) * .3 + .5, cos(t/17. + 1.) * .3 + .5), pos, t * 1.7 + 2.) * .1;
  float r3 = ripple(vec2(sin(t/23. + 2.) * .4 + .5, cos(t/23. + 2.) * .4 + .5), pos, t * 1.3 + 1.) * .1;
  return vec3(
    sin(pos.y * 10. + t) * .03,
    sin(pos.x * 10. + t) * .03,
    r1 + r2 + r3
  );
}

void main() {
  // gl_Position = view * vec4(pos + vec3(_x, _y, _z) - vec3(0.5, 0.5, 0), 1) * vec4(1, 1, 1, 1);
  vec4 offset = vec4(0.5, 0.5, 0, 1);
  gl_Position = view * (pos - offset + vec4(f(pos.xy, t), 1)) * vec4(3, 2, 1, 1);
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

const RES = 100;
const R = RES + 1;
const vs = new Float32Array(R * R * 3);
const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);

gl.enableVertexAttribArray(pos);

function ripple(x0, y0, f, p, x, y) {
  const dx = x0 - x;
  const dy = y0 - y;
  const d = Math.sqrt(dx * dx + dy * dy);
  return Math.cos(d * Math.PI * 2 * f + p * Math.PI * 2) * 0.5 + 0.5 * Math.exp(-d * 3);
}
function f(x, y) {
  // const r1 = ripple(Math.sin(now / 23) * 0.5 + 0.5, Math.cos(now / 23) * 0.5 + 0.5, 2, 0.5, x, y) * 0.2;
  // const r2 = ripple(-Math.sin(now / 19) * 0.3 + 0.5, Math.cos(now / 19) * 0.3 + 0.5, 2, 0.5, x, y) * 0.2;
  // const r3 = ripple(-Math.sin(now / 13) * 0.4 + 0.5, Math.cos(now / 13) * 0.3 + 0.5, 2, 0.5, x, y) * 0.2;
  // const r4 = ripple(0.5, 0.5, 2, 0.5, x, y) * 0.2;
  return [
    x, // + Math.sin(now / 5 + y * Math.PI * 6) * 0.01,
    y, // + Math.sin(now / 7 + x * Math.PI * 7) * 0.03,
    0, //r1 + r2 + r3 + r4,
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
    0,
    -1,
    -0.5
  ], [0, 0, 0], [0, 0, -1]);
  mat4.mul(viewM, mat4.perspective(mat4.create(), Math.PI / 4, 1300 / 700 , 0.1, 100), viewM);
  // mat4.mul(viewM, mat4.ortho(mat4.create(), -0.5, 0.5, -0.5, 0.5, 0.1, 100), viewM);
  gl.uniformMatrix4fv(view, false, viewM);
  gl.uniform1f(t, now / 15);

  gl.drawArrays(gl.POINTS, 0, R * R * 1);

  requestAnimationFrame(draw);
}

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
