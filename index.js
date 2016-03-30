const glm = require('gl-matrix');
const mat4 = glm.mat4;

const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl');
gl.clearColor(0.1, 0.1, 0.1, 1);

const vertex = `
attribute vec3 pos;
uniform mat4 view;

void main() {
  gl_Position = view * vec4((pos - vec3(0.5, 0.5, 0)) * vec3(75, 75, 15), 1);
}
`;

const fragment = `
void main() {
  gl_FragColor = vec4(0.8, 0.8, 0.8, 1);
}
`;

const program = createProgram(gl, vertex, fragment);
gl.useProgram(program);
const pos = gl.getAttribLocation(program, 'pos');
const view = gl.getUniformLocation(program, 'view');

const RES = 50;
const rows = Array(RES + 1);
for (let i = 0; i <= RES; i++) {
  rows[i] = gl.createBuffer();
}

gl.enableVertexAttribArray(pos);

function ripple(x0, y0, f, p, x, y) {
  const dx = x0 - x;
  const dy = y0 - y;
  const d = Math.sqrt(dx * dx + dy * dy);
  return Math.cos(d * Math.PI * 2 * f + p * Math.PI * 2) * Math.exp(-d * 3);
}

function draw() {
  const now = Date.now();
  gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
  const viewM = mat4.lookAt(mat4.create(), [
    0,
    -15,
    -10,
  ], [0, 0, 0], [0, 0, -1]);
  mat4.mul(viewM, mat4.perspective(mat4.create(), Math.PI / 4, 1300 / 700 , 0.1, 100), viewM);
  gl.uniformMatrix4fv(view, false, viewM);

  for (let i = 0; i <= RES; i++) {
    gl.bindBuffer(gl.ARRAY_BUFFER, rows[i]);
    let points = new Float32Array((RES + 1) * 3);
    for (let j = 0; j <= RES; j++) {
      const y = i / RES;
      const x = j / RES;
      const r1 = ripple(Math.sin(now / 23000 * Math.PI * 2) * 0.5 + 0.5, Math.cos(now / 23000 * Math.PI * 2) * 0.5 + 0.5, 2, 0.5, x, y) * 0.2;
      const r2 = ripple(-Math.sin(now / 19000 * Math.PI * 2) * 0.3 + 0.5, Math.cos(now / 19000 * Math.PI * 2) * 0.3 + 0.5, 2, 0.5, x, y) * 0.2;
      const r3 = ripple(-Math.sin(now / 13000 * Math.PI * 2) * 0.4 + 0.5, Math.cos(now / 13000 * Math.PI * 2) * 0.3 + 0.5, 2, 0.5, x, y) * 0.2;
      const r4 = ripple(0.5, 0.5, 2, 0.5, x, y) * 0.2;
      points[j * 3 + 0] = j / RES + Math.sin(now / 1000 + y * Math.PI * 6) * 0.01;
      points[j * 3 + 1] = i / RES + Math.sin(now / 1000 + x * Math.PI * 7) * 0.03;
      points[j * 3 + 2] = r1 + r2 + r3 + r4;
    }
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, RES + 1);
  }
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
