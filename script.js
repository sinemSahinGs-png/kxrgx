import * as THREE from 'three';
import { vertexShader, fluidFragmentShader, displayFragmentShader } from './shaders.js';

const CONFIG = {
  // Simulation render-target size (square, ping-pong)
  simSize: 500,
  // Trail mask falloff
  decay: 0.97,
  lineWidth: 0.09,
  perFrameIntensity: 0.3,
  // Reveal threshold (display shader)
  revealThreshold: 0.02,
  edgeWidthBase: 0.004, // divided by uDpr in shader
  // Soft gray halo overlay (display shader)
  haloUpperMul: 2.0, // halo upper bound = revealThreshold * this
  haloMixStrength: 0.35,
  haloGray: [0.12, 0.12, 0.12],
  // Idle auto-trail
  idleThresholdMs: 2500,
  idleEaseInMs: 1500,
  autoLerp: 0.05,
  // Mouse stop detection
  stopAfterMs: 50,
  // Max texture size
  maxTextureSize: 4096,
};

const canvas = document.querySelector('.hero canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, precision: 'highp' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const simScene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const renderTargetOptions = {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  depthBuffer: false,
  stencilBuffer: false,
};

const pingPong = [
  new THREE.WebGLRenderTarget(CONFIG.simSize, CONFIG.simSize, renderTargetOptions),
  new THREE.WebGLRenderTarget(CONFIG.simSize, CONFIG.simSize, renderTargetOptions),
];

renderer.setRenderTarget(pingPong[0]);
renderer.clearColor();
renderer.setRenderTarget(pingPong[1]);
renderer.clearColor();
renderer.setRenderTarget(null);

let currentTarget = 0;

const mouse = new THREE.Vector2(0.5, 0.5);
const prevMouse = new THREE.Vector2(0.5, 0.5);
const autoMouse = new THREE.Vector2(0.5, 0.5);
const prevAutoMouse = new THREE.Vector2(0.5, 0.5);
let isMoving = false;
let lastMoveTime = 0;

function makePlaceholderTexture(colorHex) {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 8;
  const ctx = c.getContext('2d');
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

const topPlaceholder = makePlaceholderTexture('#0000ff');
const bottomPlaceholder = makePlaceholderTexture('#ff0000');
const topTextureSize = new THREE.Vector2(8, 8);
const bottomTextureSize = new THREE.Vector2(8, 8);

const quad = new THREE.PlaneGeometry(2, 2);

const trailsMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader: fluidFragmentShader,
  uniforms: {
    uPrevTrails: { value: pingPong[0].texture },
    uMouse: { value: mouse.clone() },
    uPrevMouse: { value: prevMouse.clone() },
    uResolution: { value: new THREE.Vector2(CONFIG.simSize, CONFIG.simSize) },
    uDecay: { value: CONFIG.decay },
    uLineWidth: { value: CONFIG.lineWidth },
    uPerFrameIntensity: { value: CONFIG.perFrameIntensity },
    uIsMoving: { value: false },
  },
});

const displayMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader: displayFragmentShader,
  uniforms: {
    uFluid: { value: pingPong[0].texture },
    uTopTexture: { value: topPlaceholder },
    uBottomTexture: { value: bottomPlaceholder },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uTopTextureSize: { value: topTextureSize },
    uBottomTextureSize: { value: bottomTextureSize },
    uDpr: { value: renderer.getPixelRatio() },
    uRevealThreshold: { value: CONFIG.revealThreshold },
    uEdgeWidthBase: { value: CONFIG.edgeWidthBase },
    uHaloUpperMul: { value: CONFIG.haloUpperMul },
    uHaloMixStrength: { value: CONFIG.haloMixStrength },
    uHaloGray: { value: new THREE.Vector3(...CONFIG.haloGray) },
  },
});

const simMesh = new THREE.Mesh(quad, trailsMaterial);
const displayMesh = new THREE.Mesh(quad, displayMaterial);
simScene.add(simMesh);
scene.add(displayMesh);

function loadPortrait(path, sizeUniform, textureUniform) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    let source = img;
    let { width, height } = img;
    if (width > CONFIG.maxTextureSize || height > CONFIG.maxTextureSize) {
      const scale = Math.min(CONFIG.maxTextureSize / width, CONFIG.maxTextureSize / height);
      const w = Math.max(1, Math.floor(width * scale));
      const h = Math.max(1, Math.floor(height * scale));
      const off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      const ctx = off.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      source = off;
      width = w;
      height = h;
    }
    const tex = new THREE.CanvasTexture(source);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    sizeUniform.value.set(width, height);
    textureUniform.value = tex;
    console.log(`[portrait] loaded ${path} (${width}x${height})`);
  };
  img.onerror = () => {
    console.error(`[portrait] failed to load ${path}`);
  };
  img.src = path;
}

loadPortrait('/portrait_top.png', displayMaterial.uniforms.uTopTextureSize, displayMaterial.uniforms.uTopTexture);
loadPortrait('/portrait_bottom.png', displayMaterial.uniforms.uBottomTextureSize, displayMaterial.uniforms.uBottomTexture);

function pointerToCanvas(clientX, clientY, now) {
  const rect = canvas.getBoundingClientRect();
  const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  if (!inside) {
    isMoving = false;
    return;
  }
  prevMouse.copy(mouse);
  mouse.x = (clientX - rect.left) / rect.width;
  mouse.y = 1 - (clientY - rect.top) / rect.height;
  isMoving = true;
  lastMoveTime = now;
}

window.addEventListener('mousemove', (e) => {
  pointerToCanvas(e.clientX, e.clientY, performance.now());
});

canvas.addEventListener(
  'touchmove',
  (e) => {
    if (!e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const inside =
      touch.clientX >= rect.left &&
      touch.clientX <= rect.right &&
      touch.clientY >= rect.top &&
      touch.clientY <= rect.bottom;
    if (inside) e.preventDefault();
    pointerToCanvas(touch.clientX, touch.clientY, performance.now());
  },
  { passive: false }
);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  displayMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  displayMaterial.uniforms.uDpr.value = renderer.getPixelRatio();
});

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  if (isMoving && now - lastMoveTime > CONFIG.stopAfterMs) isMoving = false;
  const idleTime = now - lastMoveTime;
  const autoActive = idleTime > CONFIG.idleThresholdMs;

  const prevTarget = pingPong[currentTarget];
  currentTarget = (currentTarget + 1) % 2;
  const writeTarget = pingPong[currentTarget];
  trailsMaterial.uniforms.uPrevTrails.value = prevTarget.texture;

  if (autoActive) {
    const easeIn = Math.min(1, (idleTime - CONFIG.idleThresholdMs) / CONFIG.idleEaseInMs);
    const t = now * 0.001;
    const targetX = 0.5 + 0.30 * Math.sin(t * 0.41) + 0.12 * Math.sin(t * 0.93 + 1.3);
    const targetY = 0.5 + 0.28 * Math.cos(t * 0.37 + 0.5) + 0.10 * Math.cos(t * 1.11 + 2.7);
    prevAutoMouse.copy(autoMouse);
    autoMouse.x += (targetX - autoMouse.x) * CONFIG.autoLerp * easeIn;
    autoMouse.y += (targetY - autoMouse.y) * CONFIG.autoLerp * easeIn;
    trailsMaterial.uniforms.uMouse.value.copy(autoMouse);
    trailsMaterial.uniforms.uPrevMouse.value.copy(prevAutoMouse);
    trailsMaterial.uniforms.uIsMoving.value = true;
    mouse.copy(autoMouse);
    prevMouse.copy(prevAutoMouse);
  } else {
    trailsMaterial.uniforms.uMouse.value.copy(mouse);
    trailsMaterial.uniforms.uPrevMouse.value.copy(prevMouse);
    trailsMaterial.uniforms.uIsMoving.value = isMoving;
    autoMouse.copy(mouse);
    prevAutoMouse.copy(mouse);
  }

  renderer.setRenderTarget(writeTarget);
  renderer.render(simScene, camera);
  displayMaterial.uniforms.uFluid.value = writeTarget.texture;
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);
}

animate();
