/* =========================================================
   Hero 3D — logo do perfil @botanikafe extrudado em 3D,
   folhas e grãos de café flutuando (Three.js)
   ========================================================= */
import * as THREE from 'three';
import { SVGLoader } from '../vendor/SVGLoader.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const canvas = document.getElementById('heroGL');
const hero = document.querySelector('.hero');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gsap = window.gsap;

function fail() { document.documentElement.classList.add('no-webgl'); }

try { init(); } catch (e) { console.warn('WebGL indisponível', e); fail(); }

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const mobile = innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.6 : 1.85));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  const key = new THREE.DirectionalLight(0xfff4dc, 1.5); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xe0c46b, 0.9); rim.position.set(-6, 2, -4); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xfff8e6, 0x3a3a10, 0.25));
  scene.fog = new THREE.Fog(0xf5f0d6, 12, 30);

  const THEMES = {
    light: { fog: 0xf5f0d6, logo: 0x6f6606, logoMetal: 0.2, logoRough: 0.38, env: 0.55, leafA: 0x7a7108, leafB: 0x44521a, leafC: 0xd9b95a, bean: 0x2b1d14, exposure: 0.92 },
    dark: { fog: 0x0b1720, logo: 0xc9a43e, logoMetal: 0.8, logoRough: 0.34, env: 0.6, leafA: 0xa99c1c, leafB: 0x3f6a2e, leafC: 0xe0c46b, bean: 0x7a5534, exposure: 1.1 },
  };

  // ---------- logo extrudado ----------
  const d = document.querySelector('#logo path').getAttribute('d');
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 911 1397"><path d="${d}"/></svg>`);
  const shapes = svg.paths.flatMap((p) => SVGLoader.createShapes(p));
  const logoGeo = new THREE.ExtrudeGeometry(shapes, { depth: 60, bevelEnabled: true, bevelThickness: 16, bevelSize: 7, bevelSegments: 5, curveSegments: mobile ? 8 : 14 });
  logoGeo.center();
  const s = 1 / 1397;
  logoGeo.scale(s, -s, s); // y do SVG é invertido
  logoGeo.computeVertexNormals();
  const logoMat = new THREE.MeshPhysicalMaterial({ color: 0x6f6606, roughness: 0.38, metalness: 0.2, clearcoat: 0.45, clearcoatRoughness: 0.3 });
  const logo = new THREE.Mesh(logoGeo, logoMat);
  const logoPivot = new THREE.Group(); logoPivot.add(logo); scene.add(logoPivot);

  // ---------- folha (forma do logo) ----------
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -1);
  leafShape.bezierCurveTo(0.55, -0.6, 0.62, 0.35, 0, 1);
  leafShape.bezierCurveTo(-0.62, 0.35, -0.55, -0.6, 0, -1);
  const leafGeo = new THREE.ExtrudeGeometry(leafShape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 2, curveSegments: 16 });
  leafGeo.center();
  const lp = leafGeo.attributes.position;
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i), y = lp.getY(i);
    lp.setZ(i, lp.getZ(i) + 0.55 * x * x + 0.18 * y * y - 0.12 * y);
  }
  leafGeo.computeVertexNormals();

  // ---------- grão de café ----------
  const beanGeo = new THREE.SphereGeometry(1, 28, 20);
  const bp = beanGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    let x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
    if (z > 0) z = z * 0.55 - 0.32 * Math.exp(-(x * x) / 0.01) * z; // lado plano com sulco
    bp.setXYZ(i, x * 0.62, y * 0.86, z * 0.5);
  }
  beanGeo.computeVertexNormals();

  const leafMats = [0, 1, 2].map(() => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }));
  const beanMat = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.1 });

  const N = mobile ? { a: 9, b: 7, c: 3, bean: 9 } : { a: 16, b: 12, c: 5, bean: 16 };
  const groups = [
    { mesh: new THREE.InstancedMesh(leafGeo, leafMats[0], N.a), n: N.a, size: [0.28, 0.55] },
    { mesh: new THREE.InstancedMesh(leafGeo, leafMats[1], N.b), n: N.b, size: [0.25, 0.5] },
    { mesh: new THREE.InstancedMesh(leafGeo, leafMats[2], N.c), n: N.c, size: [0.18, 0.32] },
    { mesh: new THREE.InstancedMesh(beanGeo, beanMat, N.bean), n: N.bean, size: [0.13, 0.22], bean: true },
  ];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const parts = [];
  groups.forEach((g) => {
    g.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(g.mesh);
    for (let i = 0; i < g.n; i++) {
      parts.push({
        g, i, x: rnd(-1, 1), y: rnd(-1, 1), z: rnd(-7, 4), s: rnd(g.size[0], g.size[1]),
        rx: rnd(0, 6.28), ry: rnd(0, 6.28), rz: rnd(0, 6.28), vr: [rnd(-0.6, 0.6), rnd(-0.8, 0.8), rnd(-0.5, 0.5)],
        fall: rnd(0.12, 0.32) * (g.bean ? 1.4 : 1), sway: rnd(0.15, 0.5), ph: rnd(0, 6.28),
      });
    }
  });

  // ---------- tema ----------
  function setTheme(name) {
    const t = THEMES[name] || THEMES.light;
    scene.fog.color.setHex(t.fog);
    logoMat.color.setHex(t.logo); logoMat.metalness = t.logoMetal; logoMat.roughness = t.logoRough; logoMat.envMapIntensity = t.env;
    leafMats.forEach((m) => (m.envMapIntensity = t.env)); beanMat.envMapIntensity = t.env;
    leafMats[0].color.setHex(t.leafA); leafMats[1].color.setHex(t.leafB); leafMats[2].color.setHex(t.leafC);
    leafMats[2].metalness = name === 'dark' ? 0.7 : 0.2; leafMats[2].roughness = name === 'dark' ? 0.3 : 0.45;
    beanMat.color.setHex(t.bean);
    renderer.toneMappingExposure = t.exposure;
  }
  setTheme(document.documentElement.dataset.theme);
  addEventListener('btk-theme', (e) => { setTheme(e.detail); if (!running) render(); });

  // ---------- layout responsivo ----------
  let W = 1, H = 1, viewH = 1, viewW = 1;
  const layout = { fx: 0.7, fy: 0.24, h: 0.3 };
  function resize() {
    const r = hero.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z; viewW = viewH * camera.aspect;
    const a = W / H;
    if (a > 1.15) Object.assign(layout, { fx: 0.76, fy: 0.5, h: 0.6 });
    else if (a > 0.75) Object.assign(layout, { fx: 0.74, fy: 0.3, h: 0.36 });
    else Object.assign(layout, { fx: 0.7, fy: 0.215, h: 0.27 });
    logo.scale.setScalar(viewH * layout.h);
    logoPivot.userData.base = new THREE.Vector3((layout.fx - 0.5) * viewW, (0.5 - layout.fy) * viewH, 0);
    logoPivot.position.copy(logoPivot.userData.base);
  }
  resize();
  addEventListener('resize', resize);

  // ---------- interação ----------
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { ptr.tx = (e.clientX / innerWidth) * 2 - 1; ptr.ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    ptr.tx = Math.max(-1, Math.min(1, e.gamma / 30)); ptr.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  }, { passive: true });
  let scrollP = 0, lastScroll = scrollY, wind = 0;
  addEventListener('scroll', () => {
    scrollP = Math.min(1, scrollY / Math.max(1, H));
    wind += (scrollY - lastScroll) * 0.004; lastScroll = scrollY;
  }, { passive: true });

  // entrada do logo
  const intro = { k: reduced ? 1 : 0, spin: reduced ? 0 : -Math.PI * 1.2 };
  const startIntro = () => {
    if (reduced || !gsap) { intro.k = 1; intro.spin = 0; return; }
    gsap.to(intro, { k: 1, duration: 1.8, ease: 'elastic.out(1, 0.6)' });
    gsap.to(intro, { spin: 0, duration: 2.2, ease: 'expo.out' });
  };
  addEventListener('btk-hero-in', startIntro, { once: true });
  setTimeout(() => { if (intro.k === 0) startIntro(); }, 3500);

  // ---------- loop ----------
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), sc = new THREE.Vector3();
  const clock = new THREE.Clock();
  let running = false, visible = true, raf = 0, t = 0, paused = false;

  function step(dt) {
    t += dt;
    ptr.x += (ptr.tx - ptr.x) * 0.05; ptr.y += (ptr.ty - ptr.y) * 0.05;
    wind *= 0.92;
    camera.position.x = ptr.x * 0.7;
    camera.position.y = -ptr.y * 0.45 - scrollP * 1.2;
    camera.lookAt(0, -scrollP * 1.2, 0);

    const b = logoPivot.userData.base;
    logoPivot.position.set(b.x, b.y + Math.sin(t * 0.9) * viewH * 0.012 + scrollP * viewH * 0.25, b.z + scrollP * 2.5);
    logoPivot.rotation.y = intro.spin + Math.sin(t * 0.45) * 0.38 + ptr.x * 0.55 + scrollP * Math.PI * 0.9;
    logoPivot.rotation.x = ptr.y * 0.25 + Math.sin(t * 0.6) * 0.05;
    logoPivot.rotation.z = Math.sin(t * 0.5) * 0.04;
    logoPivot.scale.setScalar(Math.max(0.0001, intro.k));

    for (const p of parts) {
      p.y -= (p.fall * dt * 0.12) - wind * 0.02;
      if (p.y < -1.15) { p.y = 1.15; p.x = rnd(-1, 1); }
      if (p.y > 1.2) { p.y = -1.1; p.x = rnd(-1, 1); }
      p.rx += p.vr[0] * dt; p.ry += p.vr[1] * dt + wind * 0.05; p.rz += p.vr[2] * dt;
      const depthK = 1 + (-p.z) * 0.09; // mais longe → espalha mais
      v3.set((p.x * viewW * 0.55 + Math.sin(t * 0.7 + p.ph) * p.sway) * depthK, p.y * viewH * 0.6 * depthK, p.z);
      e3.set(p.rx, p.ry, p.rz); q.setFromEuler(e3);
      const k = p.s * (0.3 + 0.7 * intro.k) * (p.g.bean ? 1 : 1.25);
      sc.set(k, k, k);
      m4.compose(v3, q, sc);
      p.g.mesh.setMatrixAt(p.i, m4);
    }
    groups.forEach((g) => (g.mesh.instanceMatrix.needsUpdate = true));
  }
  function render() { renderer.render(scene, camera); }
  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, clock.getDelta());
    step(dt); render();
  }
  function start() { if (running || reduced) return; running = true; clock.getDelta(); loop(); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible && !document.hidden && !paused ? start() : stop(); }, { threshold: 0 }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : visible && !paused && start()));
  addEventListener('btk-pause', () => { paused = true; stop(); });
  addEventListener('btk-resume', () => { paused = false; if (visible && !document.hidden) start(); });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); fail(); });

  if (reduced) { intro.k = 1; intro.spin = 0; step(0.016); render(); } else start();
  document.documentElement.classList.add('has-webgl');
}
