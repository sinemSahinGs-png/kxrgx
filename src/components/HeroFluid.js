import * as THREE from 'three';
import { vertexShader, fluidFragmentShader, displayFragmentShader } from '../lib/shaders.js';
import { site } from '../config/site.js';

const CONFIG = {
  simSize: 500,
  decay: 0.97,
  lineWidth: 0.09,
  perFrameIntensity: 0.3,
  revealThreshold: 0.02,
  edgeWidthBase: 0.004,
  haloUpperMul: 2.0,
  haloMixStrength: 0.35,
  haloGray: [0.12, 0.12, 0.12],
  idleThresholdMs: 2500,
  idleEaseInMs: 1500,
  autoLerp: 0.05,
  stopAfterMs: 50,
  maxTextureSize: 4096,
};

function makePlaceholderTexture(colorHex) {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 8;
  const ctx = c.getContext('2d');
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 8, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

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
      off.getContext('2d').drawImage(img, 0, 0, w, h);
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
  };
  img.src = path;
}

/** Full-viewport mouse fluid reveal — same behavior as the original hero */
export function initHeroFluid() {
  const canvas = document.querySelector('.hero-canvas');
  const hero = document.querySelector('.hero');
  if (!canvas || !hero) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    canvas.hidden = true;
    const fallback = hero.querySelector('.hero-fallback');
    if (fallback) fallback.hidden = false;
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, precision: 'highp' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const simScene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const caps = renderer.capabilities;
  let rtType = THREE.UnsignedByteType;
  if (caps.isWebGL2) rtType = THREE.HalfFloatType;
  else {
    const gl = renderer.getContext();
    if (gl.getExtension('OES_texture_half_float')) rtType = THREE.HalfFloatType;
    else if (gl.getExtension('OES_texture_float')) rtType = THREE.FloatType;
  }

  const rtOpts = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: rtType,
    depthBuffer: false,
    stencilBuffer: false,
  };

  const pingPong = [
    new THREE.WebGLRenderTarget(CONFIG.simSize, CONFIG.simSize, rtOpts),
    new THREE.WebGLRenderTarget(CONFIG.simSize, CONFIG.simSize, rtOpts),
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
  let isTouching = false;
  let lastMoveTime = 0;

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
      uTopTexture: { value: makePlaceholderTexture('#111111') },
      uBottomTexture: { value: makePlaceholderTexture('#222222') },
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

  simScene.add(new THREE.Mesh(quad, trailsMaterial));
  scene.add(new THREE.Mesh(quad, displayMaterial));

  loadPortrait(
    site.portraitTop || site.portrait,
    displayMaterial.uniforms.uTopTextureSize,
    displayMaterial.uniforms.uTopTexture
  );
  loadPortrait(
    site.portraitBottom || site.portrait,
    displayMaterial.uniforms.uBottomTextureSize,
    displayMaterial.uniforms.uBottomTexture
  );

  canvas.style.touchAction = 'none';

  function pointerToCanvas(clientX, clientY, now) {
    const rect = canvas.getBoundingClientRect();
    const inside =
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    if (!inside) {
      if (!isTouching) isMoving = false;
      return;
    }
    prevMouse.copy(mouse);
    mouse.x = (clientX - rect.left) / rect.width;
    mouse.y = 1 - (clientY - rect.top) / rect.height;
    isMoving = true;
    lastMoveTime = now;
  }

  window.addEventListener('mousemove', (e) => {
    if (isTouching) return;
    pointerToCanvas(e.clientX, e.clientY, performance.now());
  });

  canvas.addEventListener(
    'touchstart',
    (e) => {
      if (!e.touches?.[0]) return;
      e.preventDefault();
      isTouching = true;
      pointerToCanvas(e.touches[0].clientX, e.touches[0].clientY, performance.now());
    },
    { passive: false }
  );

  canvas.addEventListener(
    'touchmove',
    (e) => {
      if (!e.touches?.[0]) return;
      e.preventDefault();
      pointerToCanvas(e.touches[0].clientX, e.touches[0].clientY, performance.now());
    },
    { passive: false }
  );

  const endTouch = () => {
    isTouching = false;
  };
  canvas.addEventListener('touchend', endTouch, { passive: true });
  canvas.addEventListener('touchcancel', endTouch, { passive: true });

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    displayMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    displayMaterial.uniforms.uDpr.value = renderer.getPixelRatio();
  });

  function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    if (!isTouching && isMoving && now - lastMoveTime > CONFIG.stopAfterMs) isMoving = false;
    const idleTime = now - lastMoveTime;
    const autoActive = idleTime > CONFIG.idleThresholdMs;

    const prevTarget = pingPong[currentTarget];
    currentTarget = (currentTarget + 1) % 2;
    const writeTarget = pingPong[currentTarget];
    trailsMaterial.uniforms.uPrevTrails.value = prevTarget.texture;

    if (autoActive) {
      const easeIn = Math.min(1, (idleTime - CONFIG.idleThresholdMs) / CONFIG.idleEaseInMs);
      const t = now * 0.001;
      const targetX = 0.5 + 0.3 * Math.sin(t * 0.41) + 0.12 * Math.sin(t * 0.93 + 1.3);
      const targetY = 0.5 + 0.28 * Math.cos(t * 0.37 + 0.5) + 0.1 * Math.cos(t * 1.11 + 2.7);
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
}
