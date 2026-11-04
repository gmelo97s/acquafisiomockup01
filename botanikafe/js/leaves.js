/* =========================================================
   Folhas 2D para transições: poucas, pequenas e curtas.
   Só aparecem em momentos (abrir item, trocar categoria,
   entrar em seção) e somem sozinhas em ~3 s.
   ========================================================= */
(function () {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.createElement('canvas');
  cv.className = 'leaves-fx'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }
  resize(); addEventListener('resize', resize);

  // folha no formato das folhas do logo
  const PALETTE = {
    light: ['#7a7108', '#4d5a18', '#9a9020', '#d2b356', '#62702c'],
    dark: ['#a99c1c', '#5d7a35', '#e0c46b', '#c2ad4a', '#7f9a48'],
  };
  function sprite(color) {
    const L = 44, c = document.createElement('canvas'); c.width = c.height = L * 2;
    const g = c.getContext('2d'); g.translate(L, L);
    g.beginPath(); g.moveTo(0, -L / 2);
    g.bezierCurveTo(L * 0.33, -L * 0.28, L * 0.35, L * 0.2, 0, L / 2);
    g.bezierCurveTo(-L * 0.35, L * 0.2, -L * 0.33, -L * 0.28, 0, -L / 2);
    g.closePath(); g.fillStyle = color; g.fill();
    g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -L * 0.42); g.quadraticCurveTo(L * 0.03, 0, 0, L * 0.47); g.stroke();
    return c;
  }
  const SPR = { light: PALETTE.light.map(sprite), dark: PALETTE.dark.map(sprite) };
  const theme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  const parts = []; let raf = 0, last = 0;
  const MAX = 36;
  function add(x, y, vx, vy, len) {
    if (parts.length >= MAX) parts.shift();
    const set = SPR[theme()];
    parts.push({
      x, y, vx, vy, len, img: set[(Math.random() * set.length) | 0],
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 5, flip: Math.random() * 6.28, vf: 2.5 + Math.random() * 4,
      ph: Math.random() * 6.28, life: 0, max: 2.4 + Math.random() * 1.4,
    });
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.life += dt;
      p.vy += 70 * dt; if (p.vy > 80) p.vy -= (p.vy - 80) * dt * 4; // gravidade + queda leve
      p.vx *= 1 - 1.1 * dt; p.vx += Math.sin(p.life * 2.3 + p.ph) * 34 * dt; // balanço
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.flip += p.vf * dt;
      const a = Math.min(1, p.life / 0.2) * Math.min(1, (p.max - p.life) / 0.7);
      if (a <= 0 || p.y > H + 50 || p.x < -80 || p.x > W + 80) { parts.splice(i, 1); continue; }
      ctx.save(); ctx.globalAlpha = 0.92 * a; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.scale(Math.cos(p.flip), 1); // "vira" no ar
      ctx.drawImage(p.img, -p.len, -p.len, p.len * 2, p.len * 2);
      ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(loop);
    else { raf = 0; ctx.clearRect(0, 0, W, H); }
  }
  const size = () => 10 + Math.random() * 10;

  window.LeafFX = {
    // estouro a partir de um ponto (abrir item, tocar card)
    burst(x, y, n = 5, power = 1) {
      if (reduced) return;
      for (let i = 0; i < n; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.5, sp = (130 + Math.random() * 170) * power;
        add(x, y, Math.cos(ang) * sp, Math.sin(ang) * sp, size());
      }
    },
    // rajada atravessando a tela (troca de seção/categoria)
    gust(dir = 1, n = 5, y0 = 0.12, y1 = 0.5) {
      if (reduced) return;
      for (let i = 0; i < n; i++) {
        const y = H * (y0 + Math.random() * (y1 - y0));
        const x = dir > 0 ? -30 - Math.random() * 90 : W + 30 + Math.random() * 90;
        add(x, y, dir * (300 + Math.random() * 260), -60 + Math.random() * 70, size());
      }
    },
    // algumas folhas caindo do topo
    fall(n = 4) {
      if (reduced) return;
      for (let i = 0; i < n; i++) add(Math.random() * W, -20 - Math.random() * 60, (Math.random() - 0.5) * 60, 30 + Math.random() * 30, size());
    },
  };
})();
