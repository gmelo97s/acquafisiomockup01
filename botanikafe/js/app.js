/* =========================================================
   Botanikafé · Cardápio — interface e animações
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const MENU = window.MENU;
  const S = window.SmartSearch;
  const P = window.Pairings;
  const FX = window.LeafFX || { burst() {}, gust() {}, fall() {} };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem storage */ } },
  };
  const fmt = (c) => { const v = c / 100; return 'R$ ' + (Number.isInteger(v) ? v : v.toFixed(2).replace('.', ',')); };
  const TAGS = {
    'Vegano': ['Vegano', ''], 'Vegetariano': ['Vegetariano', ''], 'Sem Gluten': ['Sem glúten', ''], 'Sem Lactose': ['Sem lactose', ''],
    'Sem açúcar': ['Sem açúcar', ''], 'Apimentado': ['Picante', 'tag--hot'], 'Levemente Apimentado': ['Levemente picante', 'tag--hot'],
  };
  const tagHTML = (t) => { const m = TAGS[t] || [t, '']; return `<span class="tag ${m[1]}">${esc(m[0])}</span>`; };
  const isTall = (it) => it.r && it.r > 1.25;
  const catName = (cat) => (cat.id === 'foam' ? 'Novidades' : cat.n);

  const BY_ID = new Map();
  MENU.cats.forEach((cat) => cat.secs.forEach((sec) => sec.items.forEach((it) => BY_ID.set(it.id, { it, cat, sec }))));
  S.build(MENU);
  if (P) P.index(MENU);

  const minSize = (it) => Math.min(...it.s.map((s) => s.p));
  function priceHTML(it) {
    if (!it.p) return '';
    if (it.s && it.s.length > 1) return `<span class="price"><small>a partir de</small>${fmt(minSize(it))}</span>`;
    if (it.s && it.s.length === 1 && it.s[0].l) return `<span class="price">${fmt(it.s[0].p)} <small>${esc(it.s[0].l)}</small></span>`;
    return `<span class="price">${fmt(it.p)}</span>`;
  }
  const priceText = (it) => (it.p ? (it.s && it.s.length > 1 ? 'a partir de ' + fmt(minSize(it)) : fmt(it.s && it.s.length === 1 ? it.s[0].p : it.p)) : '');

  const toastEl = $('#toast'); let toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200); }
  const center = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  // ---------- abertura com a chave: liga o modo "porta" ----------
  const gateOn = hasGSAP && !reduced;
  if (gateOn) root.classList.add('gate-on');

  // ---------- rolagem suave ----------
  let lenis = null;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis && finePointer && !reduced) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    if (hasGSAP) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  const hdrH = () => parseInt(getComputedStyle(root).getPropertyValue('--hdr-h'), 10) || 60;
  let scrollRaf = 0;
  const stopScrollAnim = () => cancelAnimationFrame(scrollRaf);
  addEventListener('wheel', stopScrollAnim, { passive: true });
  addEventListener('touchstart', stopScrollAnim, { passive: true });
  function scrollToY(y, dur) {
    y = Math.max(0, Math.min(y, root.scrollHeight - innerHeight));
    if (lenis) { lenis.scrollTo(y, { duration: (dur || 1200) / 1000 }); return; }
    if (reduced) { window.scrollTo(0, y); return; }
    stopScrollAnim();
    const y0 = scrollY, d = y - y0, T = dur || Math.min(1400, 450 + Math.abs(d) * 0.3), t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / T), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, y0 + d * e); if (k < 1) scrollRaf = requestAnimationFrame(step);
    };
    scrollRaf = requestAnimationFrame(step);
  }
  const docTop = (el) => el.getBoundingClientRect().top + scrollY;
  const OFFSETS = { '#inicio': null, '#cardapio': 0, '#novidades': () => -(hdrH() + 64) };
  function goTo(hash, dur) {
    const el = $(hash); if (!el) return;
    if (hash === '#inicio') { scrollToY(0, dur || 1600); return; }
    const o = OFFSETS[hash];
    const off = typeof o === 'function' ? o() : o != null ? o : -(hdrH() + 14);
    scrollToY(docTop(el) + off, dur);
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    const throughGate = gateOn && scrollY < docTop($('#cardapio')) - 10 && id !== '#inicio';
    goTo(id, a.hasAttribute('data-open-menu') || (throughGate && id === '#cardapio') ? 2600 : undefined);
  }));

  function lockScroll(on) {
    root.style.overflow = on ? 'hidden' : '';
    if (lenis) on ? lenis.stop() : lenis.start();
    window.dispatchEvent(new Event(on ? 'btk-pause' : 'btk-resume'));
  }

  // ---------- tema dia / noite ----------
  const metaTheme = $$('meta[name="theme-color"]');
  function applyTheme(t) {
    root.dataset.theme = t;
    metaTheme.forEach((m) => m.setAttribute('content', t === 'dark' ? '#0b1720' : '#f5f0d6'));
    window.dispatchEvent(new CustomEvent('btk-theme', { detail: t }));
  }
  $('#themeToggle').addEventListener('click', (e) => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('btk-theme', next); } catch (err) { /* ok */ }
    FX.gust(next === 'dark' ? -1 : 1, 6, 0.1, 0.5);
    if (!document.startViewTransition || reduced) return applyTheme(next);
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] }, { duration: 750, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let saved = null; try { saved = localStorage.getItem('btk-theme'); } catch (err) { /* ok */ }
    if (!saved) applyTheme(e.matches ? 'dark' : 'light');
  });

  // ---------- topo / dock ----------
  const hdr = $('#hdr'), dock = $('.dock'), menuEl = $('#cardapio');
  if (hasGSAP && !reduced) dock.classList.add('pre');
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    const past = gateOn ? y >= docTop(menuEl) - 4 : y > 30;
    hdr.classList.toggle('scrolled', past);
    if (Math.abs(y - lastY) > 6) { dock.classList.toggle('hide', y > lastY && y > docTop(menuEl) + 400); lastY = y; }
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const navIO = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      const dockId = id === 'novidades' ? 'cardapio' : id;
      $$('.dock a').forEach((a) => a.classList.toggle('active', a.dataset.dock === dockId));
      $$('.hdr__nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['inicio', 'novidades', 'cardapio', 'galeria', 'visite'].forEach((id) => { const s = document.getElementById(id); if (s) navIO.observe(s); });

  // ---------- busca do topo: exemplos digitando ----------
  const typedEl = $('#typed');
  const PH = ['matcha gelado', 'vegano até R$ 40', 'drink com tequila', 'algo sem glúten', 'café da manhã', 'beneditino sem salmão', 'doce vegano'];
  if (!reduced) {
    let pi = 0, ci = PH[0].length, del = true;
    const tick = () => {
      if (del) { ci--; if (ci <= 0) { del = false; pi = (pi + 1) % PH.length; } }
      else { ci++; if (ci >= PH[pi].length) { del = true; typedEl.textContent = PH[pi]; return setTimeout(tick, 1900); } }
      typedEl.textContent = PH[pi].slice(0, Math.max(0, ci)) || '​';
      setTimeout(tick, del ? 38 : 72);
    };
    setTimeout(tick, 2800);
  }

  // =========================================================
  // CARDÁPIO
  // =========================================================
  const tabsEl = $('#tabs'), listEl = $('#menuList'), ink = $('.tabs__ink');
  const foam = MENU.cats.find((c) => c.id === 'foam');
  const listCats = MENU.cats.filter((c) => c.id !== 'foam');
  const TAB_DEFS = (foam ? [{ id: 'novidades', n: 'Novidades', target: '#novidades' }] : [])
    .concat(listCats.map((c) => ({ id: c.id, n: c.n, target: '#cat-' + c.id })));
  tabsEl.insertAdjacentHTML('beforeend', TAB_DEFS.map((t, i) => `<button class="tab" role="tab" type="button" aria-selected="${i === 0}" data-cat="${t.id}" data-target="${t.target}">${esc(t.n)}</button>`).join(''));

  const mediaHTML = (it, size) => (it.i
    ? `<span class="item__media${isTall(it) ? ' is-tall' : ''}"><img src="${it.i}" alt="" loading="lazy" decoding="async" width="${size}" height="${size}" onload="this.classList.add('loaded')"></span>`
    : `<span class="item__media item__media--empty"><svg aria-hidden="true"><use href="#logo"/></svg></span>`);
  const itemHTML = (it) => `<li><button class="item rv" type="button" data-id="${it.id}" data-tags="${esc((it.t || []).join('|'))}">
      <span class="item__body"><span class="item__name">${esc(it.n)}</span>${it.d ? `<span class="item__desc">${esc(it.d)}</span>` : ''}
      <span class="item__meta">${priceHTML(it)}${(it.t || []).map(tagHTML).join('')}</span></span>${mediaHTML(it, 104)}</button></li>`;
  listEl.innerHTML = listCats.map((c) => `
    <section class="mcat" id="cat-${c.id}" data-cat="${c.id}" aria-labelledby="h-${c.id}">
      <div class="mcat__head rv"><h3 class="mcat__title" id="h-${c.id}">${esc(c.n)}</h3><p class="mcat__sub">${esc(c.sub)}</p></div>
      ${c.secs.map((s) => `<div class="msec">
        ${c.secs.length > 1 || s.n !== c.n ? `<h4 class="msec__title">${esc(s.n)}</h4>` : ''}
        ${s.d ? `<p class="msec__desc">${esc(s.d)}</p>` : ''}
        <ul class="items">${s.items.map(itemHTML).join('')}</ul></div>`).join('')}
    </section>`).join('');

  // revelar ao rolar (itens aparecem antes de entrar na tela, sem "buracos")
  const revealIO = new IntersectionObserver((ents) => {
    let i = 0;
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target; el.style.transitionDelay = Math.min(i++ * 40, 280) + 'ms';
      el.classList.add('in'); revealIO.unobserve(el);
      setTimeout(() => { el.style.transitionDelay = ''; }, 1000);
    });
  }, { rootMargin: '0px 0px 30% 0px' });
  const watchReveal = (els) => els.forEach((el) => (reduced ? el.classList.add('in') : revealIO.observe(el)));
  watchReveal($$('.rv', listEl));

  // abas: tinta deslizante + categoria ativa
  function moveInk(btn) {
    if (!btn) return;
    ink.style.width = btn.offsetWidth + 'px';
    ink.style.transform = `translateX(${btn.offsetLeft}px)`;
    tabsEl.scrollTo({ left: btn.offsetLeft - tabsEl.clientWidth / 2 + btn.offsetWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
  }
  let activeCat = TAB_DEFS[0] && TAB_DEFS[0].id;
  function setActiveTab(id) {
    activeCat = id;
    $$('.tab', tabsEl).forEach((b) => { const on = b.dataset.cat === id; b.setAttribute('aria-selected', on); if (on) moveInk(b); });
  }
  let tabLock = 0, lastGust = 0, lastCatY = scrollY;
  tabsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.tab'); if (!b) return;
    setActiveTab(b.dataset.cat); tabLock = Date.now() + 1300;
    const target = $(b.dataset.target);
    $$('.rv', target).forEach((el) => el.classList.add('in'));
    scrollToY(docTop(target) - (hdrH() + 64));
    FX.gust(1, 4, 0.14, 0.32);
  });
  const catIO = new IntersectionObserver((ents) => {
    if (Date.now() < tabLock) return;
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.dataset.cat;
      if (id === activeCat) return;
      setActiveTab(id);
      const now = Date.now();
      if (now - lastGust > 1500) { lastGust = now; FX.gust(scrollY >= lastCatY ? 1 : -1, 4, 0.14, 0.34); }
      lastCatY = scrollY;
    });
  }, { rootMargin: '-30% 0px -65% 0px' });
  $$('.mcat').forEach((s) => catIO.observe(s));
  const newsSec = $('#novidades'); newsSec.dataset.cat = 'novidades'; catIO.observe(newsSec);
  requestAnimationFrame(() => moveInk($('.tab', tabsEl)));
  addEventListener('resize', () => moveInk($('.tab[aria-selected="true"]', tabsEl)));
  if (document.fonts) document.fonts.ready.then(() => moveInk($('.tab[aria-selected="true"]', tabsEl)));

  // filtros alimentares
  const FILTERS = [
    { id: 'vegano', label: 'Vegano', tags: ['Vegano'] },
    { id: 'veg', label: 'Vegetariano', tags: ['Vegetariano', 'Vegano'] },
    { id: 'sg', label: 'Sem glúten', tags: ['Sem Gluten'] },
    { id: 'sl', label: 'Sem lactose', tags: ['Sem Lactose'] },
    { id: 'hot', label: 'Picante', tags: ['Apimentado', 'Levemente Apimentado'] },
  ];
  const active = new Set();
  $('#filters').innerHTML = FILTERS.map((f) => `<button class="chip" type="button" aria-pressed="false" data-f="${f.id}">${f.label}</button>`).join('');
  $('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const id = b.dataset.f; active.has(id) ? active.delete(id) : active.add(id);
    b.setAttribute('aria-pressed', active.has(id));
    const [x, y] = center(b); FX.burst(x, y, 3, 0.7);
    applyFilters();
  });
  function applyFilters() {
    const fs = FILTERS.filter((f) => active.has(f.id));
    const ok = (tags) => fs.every((f) => tags.some((t) => f.tags.includes(t)));
    let n = 0;
    $$('.item', listEl).forEach((el) => {
      const pass = ok(el.dataset.tags ? el.dataset.tags.split('|') : []);
      el.parentElement.classList.toggle('is-hidden', !pass); el.classList.toggle('is-hidden', !pass);
      if (pass) { n++; el.classList.add('in'); }
    });
    $$('.msec', listEl).forEach((s) => s.classList.toggle('is-hidden', !$('.item:not(.is-hidden)', s)));
    $$('.mcat', listEl).forEach((s) => s.classList.toggle('is-hidden', !$('.item:not(.is-hidden)', s)));
    newsSec.classList.toggle('is-hidden', fs.length > 0 && !$$('.ncard', newsSec).some((c) => ok((c.dataset.tags || '').split('|').filter(Boolean))));
    $$('.tab', tabsEl).forEach((t) => { const c = $(t.dataset.target); t.hidden = c.classList.contains('is-hidden'); });
    $('#filterResult').innerHTML = fs.length ? `${n} ${n === 1 ? 'item' : 'itens'} · ${fs.map((f) => f.label).join(' + ')} <button class="link" type="button" id="clearF">limpar</button>` : '';
    const cf = $('#clearF'); if (cf) cf.onclick = () => { active.clear(); $$('#filters .chip').forEach((c) => c.setAttribute('aria-pressed', 'false')); applyFilters(); };
    if (hasGSAP) ScrollTrigger.refresh();
    const vis = $('.tab:not([hidden])', tabsEl); if (vis) setActiveTab(vis.dataset.cat);
  }
  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('.item'); if (!b) return;
    openItem(b.dataset.id, b);
  });

  // =========================================================
  // NOVIDADES
  // =========================================================
  const newsTrack = $('#newsTrack');
  if (foam) {
    const items = foam.secs.flatMap((s) => s.items);
    newsTrack.innerHTML = items.map((it) => `
      <button class="ncard" type="button" data-id="${it.id}" data-tags="${esc((it.t || []).join('|'))}" aria-label="${esc(it.n)}, ${esc(priceText(it))}">
        <span class="ncard__media"><img src="${it.i}" alt="" loading="lazy" decoding="async"><span class="ncard__tag">Novo</span></span>
        <span class="ncard__body"><span class="ncard__name">${esc(it.n)}</span><span class="ncard__desc">${esc(it.d)}</span>
          <span class="ncard__foot"><span class="ncard__price">${esc(priceText(it))}</span><span class="ncard__more">Ver<svg><use href="#i-arrow"/></svg></span></span></span>
      </button>`).join('');
  } else newsSec.remove();
  newsTrack.addEventListener('click', (e) => { const c = e.target.closest('.ncard'); if (c) openItem(c.dataset.id, c); });
  // parallax da foto ao arrastar o carrossel (celular)
  const newsCards = $$('.ncard', newsTrack);
  let newsRaf = 0;
  const newsParallax = () => {
    newsRaf = 0;
    const tr = newsTrack.getBoundingClientRect(), cx = tr.left + tr.width / 2;
    newsCards.forEach((c) => { const r = c.getBoundingClientRect(); const d = (r.left + r.width / 2 - cx) / tr.width; c.style.setProperty('--px', (-6 - d * 6).toFixed(2) + '%'); });
  };
  newsTrack.addEventListener('scroll', () => { if (!newsRaf) newsRaf = requestAnimationFrame(newsParallax); }, { passive: true });
  newsParallax();
  // inclinação 3D com o mouse (desktop)
  if (finePointer && !reduced) {
    newsCards.forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.transform = `perspective(900px) rotateX(${((0.5 - y) * 8).toFixed(2)}deg) rotateY(${((x - 0.5) * 10).toFixed(2)}deg) translateZ(0)`;
        c.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
  }

  // =========================================================
  // CAMADAS (busca / item) + botão voltar do celular
  // =========================================================
  const layers = [];
  function pushLayer(name, hash) { layers.push(name); history.pushState({ layer: name }, '', hash || location.pathname + location.search); }
  function popLayer(name) { if (layers[layers.length - 1] === name) history.back(); }
  addEventListener('popstate', () => {
    const top = layers.pop();
    if (top === 'search') closeSearchUI(); else if (top === 'sheet') closeSheetUI();
  });

  // =========================================================
  // BUSCA
  // =========================================================
  const searchEl = $('#search'), qEl = $('#q'), resultsEl = $('#results'), intentEl = $('#intent');
  const SUGS = ['matcha gelado', 'vegano até R$ 40', 'café da manhã', 'drink com tequila', 'sem glúten', 'algo barato', 'doce vegano', 'almoço picante', 'vinho tinto', 'beneditino sem salmão', 'cold brew'];
  $('#sugs').innerHTML = SUGS.map((s) => `<button class="chip" type="button" data-q="${esc(s)}">${esc(s)}</button>`).join('');
  const CAT_IMG = { brunch: 'img/b/mesa-brunch-sm.webp', lunch: 'img/b/lunch-time-sm.webp', cafe: 'img/b/cafe-da-manha3-sm.webp', sucos: 'img/b/smoothie-verao-sm.webp', doces: 'img/b/torta-maca-sm.webp' };
  $('#searchCats').innerHTML = MENU.cats.map((c) => {
    const img = CAT_IMG[c.id] || (c.secs.flatMap((s) => s.items).find((i) => i.i && !isTall(i)) || c.secs[0].items.find((i) => i.i) || {}).i;
    return `<button class="scat" type="button" data-target="${c.id === 'foam' ? '#novidades' : '#cat-' + c.id}"><img src="${img}" alt="" loading="lazy"><span>${esc(catName(c))}</span></button>`;
  }).join('');
  let disabled = new Set(), kbIdx = -1;

  function renderRecent() {
    const rec = store.get('btk-recent') || [];
    $('#recentWrap').hidden = !rec.length;
    $('#recent').innerHTML = rec.map((s) => `<button class="chip" type="button" data-q="${esc(s)}">${esc(s)}</button>`).join('');
  }
  function saveRecent(q) {
    q = q.trim(); if (q.length < 2) return;
    const rec = (store.get('btk-recent') || []).filter((x) => x.toLowerCase() !== q.toLowerCase());
    rec.unshift(q); store.set('btk-recent', rec.slice(0, 6));
  }
  $('#clearRecent').addEventListener('click', () => { store.set('btk-recent', []); renderRecent(); });

  function openSearch(q) {
    if (!searchEl.hidden) { if (q != null) { qEl.value = q; runSearch(); } return; }
    searchEl.hidden = false; lockScroll(true); renderRecent(); pushLayer('search');
    qEl.value = q || ''; disabled = new Set(); runSearch();
    if (hasGSAP && !reduced) {
      const desk = innerWidth >= 760;
      gsap.fromTo('.search__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.35 });
      gsap.fromTo('.search__panel', desk ? { opacity: 0, y: -18 } : { yPercent: 100 }, desk ? { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', clearProps: 'opacity' } : { yPercent: 0, duration: 0.55, ease: 'expo.out' });
      gsap.fromTo('.search__empty > *', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, delay: 0.1, ease: 'power3.out' });
    }
    setTimeout(() => qEl.focus({ preventScroll: true }), 60);
  }
  function closeSearchUI() {
    if (searchEl.hidden) return;
    const done = () => { searchEl.hidden = true; lockScroll(false); stopVoice(); };
    if (hasGSAP && !reduced) {
      const desk = innerWidth >= 760;
      gsap.to('.search__backdrop', { opacity: 0, duration: 0.25 });
      gsap.to('.search__panel', desk ? { opacity: 0, y: -10, duration: 0.25, onComplete: done } : { yPercent: 100, duration: 0.35, ease: 'power3.in', onComplete: done });
    } else done();
  }
  $$('[data-open-search]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openSearch(b.dataset.q); }));
  $$('[data-close-search]').forEach((b) => b.addEventListener('click', () => popLayer('search')));
  addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') { if (!$('#sheet').hidden) popLayer('sheet'); else if (!searchEl.hidden) popLayer('search'); }
  });
  let qT;
  qEl.addEventListener('input', () => { disabled = new Set(); clearTimeout(qT); qT = setTimeout(runSearch, 60); });
  qEl.addEventListener('keydown', (e) => {
    const rows = $$('.res', resultsEl);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!rows.length) return;
      kbIdx = (kbIdx + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
      rows.forEach((r, i) => r.classList.toggle('kb', i === kbIdx)); rows[kbIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      saveRecent(qEl.value);
      const r = rows[kbIdx >= 0 ? kbIdx : 0]; if (r && kbIdx >= 0) r.click(); else qEl.blur();
    }
  });
  searchEl.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-q]');
    if (chip && searchEl.contains(chip)) { qEl.value = chip.dataset.q; disabled = new Set(); runSearch(); qEl.focus({ preventScroll: true }); return; }
    const cat = e.target.closest('.scat');
    if (cat) { popLayer('search'); setTimeout(() => { const t = $(cat.dataset.target); if (t) { $$('.rv', t).forEach((el) => el.classList.add('in')); scrollToY(docTop(t) - (hdrH() + 64)); } }, 380); return; }
    const x = e.target.closest('[data-unchip]');
    if (x) { disabled.add(x.dataset.unchip); runSearch(); return; }
    const sug = e.target.closest('[data-sug]');
    if (sug) { qEl.value = sug.dataset.sug; runSearch(); return; }
    const res = e.target.closest('.res');
    if (res) { saveRecent(qEl.value); openItem(res.dataset.id, res, true); }
  });
  function hl(name, set) {
    if (!set || !set.size) return esc(name);
    return name.split(/(\s+)/).map((tok) => { const n = S.norm(tok).replace(/[^a-z0-9]/g, ''); return n && set.has(n) ? `<mark>${esc(tok)}</mark>` : esc(tok); }).join('');
  }
  let lastGood = '', emptyT = 0, shown = new Set();
  function runSearch() {
    const q = qEl.value.trim(); kbIdx = -1;
    clearTimeout(emptyT);
    if (q.length < 2) { searchEl.classList.remove('has-q'); intentEl.innerHTML = ''; resultsEl.innerHTML = ''; lastGood = ''; shown = new Set(); return; }
    const r = S.search(q, { disabled });
    if (!r.results.length) {
      // ditando por voz ("quero um…"): espera a frase ganhar sentido antes de dizer "nada encontrado"
      if (document.getElementById('micBtn').classList.contains('listening')) return;
      // ainda digitando ("vegano até R$ 4…"): mantém os últimos resultados por um instante
      if (lastGood && q.length > lastGood.length && q.toLowerCase().startsWith(lastGood.toLowerCase())) {
        emptyT = setTimeout(() => renderSearch(q, r), 700);
        return;
      }
    }
    renderSearch(q, r);
  }
  function renderSearch(q, r) {
    searchEl.classList.add('has-q');
    intentEl.innerHTML = r.intent.chips.map((c) => `<span class="ichip">${esc(c.label)}<button type="button" data-unchip="${esc(c.label)}" aria-label="Remover ${esc(c.label)}"><svg><use href="#i-x"/></svg></button></span>`).join('');
    if (!r.results.length) {
      shown = new Set();
      resultsEl.innerHTML = `<li class="noresults"><svg aria-hidden="true"><use href="#logo"/></svg><p>Nada encontrado para <strong>“${esc(q)}”</strong>.</p>
        ${r.suggestion ? `<p>Você quis dizer <button class="chip" type="button" data-sug="${esc(r.suggestion)}">${esc(r.suggestion)}</button>?</p>` : ''}
        <p>Tente: ${['matcha', 'vegano', 'até R$ 30', 'pancake'].map((s) => `<button class="chip" type="button" data-sug="${s}">${s}</button>`).join('')}</p></li>`;
      return;
    }
    const n = r.results.length; lastGood = q;
    // enquanto digita, só as linhas novas entram animadas; as que já estavam ficam paradas (sem piscar)
    const list = r.results.slice(0, 60); let k = 0;
    const was = shown; shown = new Set(list.map((x) => x.item.id));
    const meta = r.pair ? `<strong>${n}</strong> ${n === 1 ? 'sugestão' : 'sugestões'} para acompanhar <strong>${esc(r.pair.item.n)}</strong>` : `<strong>${n}</strong> ${n === 1 ? 'resultado' : 'resultados'}${r.relaxed ? ' parecidos' : ''}`;
    resultsEl.innerHTML = `<li class="results__meta">${meta}</li>` +
      list.map((x) => { const still = was.has(x.item.id); return `<li class="res${still ? ' res--still' : ''}" role="option" data-id="${x.item.id}"${still ? '' : ` style="animation-delay:${Math.min(k++ * 22, 300)}ms"`}>
        ${x.item.i ? `<img class="res__img${isTall(x.item) ? ' is-tall' : ''}" src="${x.item.i}" alt="" loading="lazy">` : `<span class="res__img"></span>`}
        <span class="res__t"><span class="res__n">${hl(x.item.n, x.hl)}</span><span class="res__c">${esc([catName(x.cat)].concat(x.also).join(' · '))} › ${esc(x.sec.n)}${x.item.t && x.item.t.length ? ' · ' + x.item.t.map((t) => (TAGS[t] || [t])[0]).join(', ') : ''}</span></span>
        <span class="res__p">${esc(priceText(x.item))}</span></li>`; }).join('');
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; let rec = null;
  const micBtn = $('#micBtn');
  if (SR) {
    micBtn.hidden = false;
    micBtn.addEventListener('click', () => {
      if (rec) return stopVoice();
      rec = new SR(); rec.lang = 'pt-BR'; rec.interimResults = true;
      micBtn.classList.add('listening'); qEl.placeholder = 'Ouvindo…';
      rec.onresult = (ev) => { qEl.value = Array.from(ev.results).map((r) => r[0].transcript).join(' '); runSearch(); };
      rec.onend = () => { stopVoice(); saveRecent(qEl.value); };
      rec.onerror = () => stopVoice();
      try { rec.start(); } catch (e) { stopVoice(); }
    });
  }
  function stopVoice() { if (rec) { try { rec.stop(); } catch (e) { /* ok */ } } rec = null; micBtn.classList.remove('listening'); qEl.placeholder = 'O que você quer hoje?'; runSearch(); }

  // =========================================================
  // FICHA DO ITEM (+ "combina com")
  // =========================================================
  const sheet = $('#sheet'), panel = $('#sheetPanel'), sImg = $('#sheetImg'), sMedia = $('#sheetMedia'), sContent = $('#sheetContent');
  let currentId = null;
  function fillSheet(id) {
    const rec = BY_ID.get(id); if (!rec) return false;
    const { it, cat, sec } = rec; currentId = id;
    $('#sheetCrumb').textContent = catName(cat) + (sec.n !== cat.n ? ' · ' + sec.n : '');
    $('#sheetName').textContent = it.n;
    $('#sheetDesc').textContent = it.d || '';
    $('#sheetTags').innerHTML = (it.t || []).map(tagHTML).join('');
    let opts = '';
    if (it.s && (it.s.length > 1 || it.s[0].l)) opts += `<div class="opt"><h4>${cat.id === 'vinhos' ? 'Garrafa' : 'Tamanhos'}</h4><ul>${it.s.map((s) => `<li><span>${esc(s.l || 'Padrão')}${s.o ? `<small>${esc(s.o)}</small>` : ''}</span><b>${fmt(s.p)}</b></li>`).join('')}</ul></div>`;
    (it.x || []).forEach((g) => { if (g.c.length) opts += `<div class="opt"><h4>${esc(g.g || 'Opções')}</h4><ul>${g.c.map((c) => `<li><span>${esc(c.l)}</span><b>${c.p ? fmt(c.p) : ''}</b></li>`).join('')}</ul></div>`; });
    $('#sheetOpts').innerHTML = opts;
    const multi = it.s && it.s.length > 1;
    $('#sheetPrice').innerHTML = it.p ? `<small>${multi ? 'a partir de' : 'preço'}</small>${fmt(multi ? minSize(it) : it.s && it.s.length === 1 ? it.s[0].p : it.p)}` : '<small>preço</small>consulte';
    sMedia.classList.toggle('is-tall', !!isTall(it));
    if (it.i) { sMedia.classList.remove('empty'); sImg.src = it.i; sImg.alt = it.n; }
    else { sMedia.classList.add('empty'); sImg.removeAttribute('src'); sImg.alt = ''; }
    // combina com
    const pair = P ? P.suggest(rec) : null;
    const pairEl = $('#sheetPair');
    if (pair) {
      $('#pairTitle').textContent = pair.title;
      $('#pairList').innerHTML = pair.items.map((r) => `<button class="pair__item" type="button" data-id="${r.it.id}">
          <span class="pair__img${isTall(r.it) ? ' is-tall' : ''}">${r.it.i ? `<img src="${r.it.i}" alt="" loading="lazy">` : ''}</span>
          <span class="pair__n">${esc(r.it.n)}</span><span class="pair__p">${esc(priceText(r.it) || catName(r.cat))}</span></button>`).join('');
      pairEl.hidden = false;
    } else pairEl.hidden = true;
    return true;
  }
  function openItem(id, fromEl, fromSearch) {
    if (!fillSheet(id)) return;
    if (fromSearch && !searchEl.hidden) {
      searchEl.hidden = true; stopVoice();
      layers[layers.length - 1] = 'sheet'; history.replaceState({ layer: 'sheet' }, '', '#item-' + id);
    } else pushLayer('sheet', '#item-' + id);
    sheet.hidden = false; lockScroll(true); panel.scrollTop = 0; sContent.scrollTop = 0;
    if (fromEl) { const [x, y] = center(fromEl); FX.burst(x, y, 5, 0.9); }
    if (!hasGSAP || reduced) return;
    const desk = innerWidth >= 760;
    gsap.killTweensOf([panel, sImg]);
    gsap.fromTo('.sheet__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.35 });
    if (desk) gsap.fromTo(panel, { opacity: 0, y: 26, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'expo.out', clearProps: 'transform,opacity' });
    else gsap.fromTo(panel, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'expo.out', clearProps: 'transform' });
    gsap.fromTo(sImg, { scale: 1.08, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out', clearProps: 'transform,opacity' });
    gsap.fromTo('#sheetContent > *', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.04, delay: 0.12, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  function swapItem(id, fromEl) {
    if (!BY_ID.has(id) || id === currentId) return;
    if (fromEl) { const [x, y] = center(fromEl); FX.burst(x, y, 4, 0.8); }
    history.replaceState({ layer: 'sheet' }, '', '#item-' + id);
    if (!hasGSAP || reduced) { fillSheet(id); panel.scrollTop = 0; sContent.scrollTop = 0; return; }
    const parts = [sImg, ...$$('#sheetContent > *')];
    gsap.to(parts, { opacity: 0, y: -10, duration: 0.2, stagger: 0.015, ease: 'power2.in', onComplete: () => {
      fillSheet(id); panel.scrollTop = 0; sContent.scrollTop = 0;
      gsap.fromTo([sImg, ...$$('#sheetContent > *')], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.035, ease: 'power3.out', clearProps: 'transform,opacity' });
    } });
  }
  function closeSheetUI() {
    if (sheet.hidden) return;
    const done = () => { sheet.hidden = true; lockScroll(false); if (hasGSAP) gsap.set(panel, { clearProps: 'all' }); currentId = null; };
    if (!hasGSAP || reduced) return done();
    const desk = innerWidth >= 760;
    gsap.to('.sheet__backdrop', { opacity: 0, duration: 0.3 });
    gsap.to(panel, desk ? { opacity: 0, y: 16, scale: 0.98, duration: 0.25, onComplete: done } : { yPercent: 100, duration: 0.38, ease: 'power3.in', onComplete: done });
  }
  $$('[data-close-sheet]').forEach((b) => b.addEventListener('click', () => popLayer('sheet')));
  $('#pairList').addEventListener('click', (e) => { const b = e.target.closest('.pair__item'); if (b) swapItem(b.dataset.id, b); });
  $('#shareItem').addEventListener('click', async () => {
    const rec = BY_ID.get(currentId); if (!rec) return;
    const url = location.origin + location.pathname + '#item-' + currentId;
    const text = `${rec.it.n} · Botanikafé`;
    try {
      if (navigator.share) await navigator.share({ title: text, text, url });
      else { await navigator.clipboard.writeText(url); toast('Link copiado'); }
    } catch (e) { /* cancelado */ }
  });
  // arrastar para fechar (celular)
  (function dragClose() {
    let y0 = null, dy = 0, t0 = 0;
    panel.addEventListener('touchstart', (e) => { if (innerWidth >= 760 || panel.scrollTop > 0) return; y0 = e.touches[0].clientY; dy = 0; t0 = Date.now(); }, { passive: true });
    panel.addEventListener('touchmove', (e) => {
      if (y0 == null) return;
      dy = e.touches[0].clientY - y0;
      if (dy > 0 && panel.scrollTop <= 0) { e.preventDefault(); panel.style.transform = `translateY(${dy}px)`; $('.sheet__backdrop').style.opacity = String(Math.max(0, 1 - dy / 500)); }
      else if (dy < 0) { y0 = null; panel.style.transform = ''; }
    }, { passive: false });
    panel.addEventListener('touchend', () => {
      if (y0 == null) return; y0 = null;
      const v = dy / Math.max(1, Date.now() - t0);
      if (dy > 120 || v > 0.6) popLayer('sheet');
      else { panel.style.transition = 'transform .35s cubic-bezier(.34,1.56,.64,1)'; panel.style.transform = ''; $('.sheet__backdrop').style.opacity = '1'; setTimeout(() => { panel.style.transition = ''; }, 380); }
    });
  })();
  if (/^#item-/.test(location.hash)) {
    const id = location.hash.slice(6);
    if (BY_ID.has(id)) { history.replaceState(null, '', location.pathname + location.search); setTimeout(() => openItem(id), 900); }
  }

  // =========================================================
  // GALERIA — carrossel automático, infinito e arrastável
  // =========================================================
  const GAL = [
    ['bowl-aurora', 'Bowl Aurora'], ['people', 'Encontros no parque'], ['salmao-sour', 'Salmão Sour'], ['mesa-brunch', 'Mesa de brunch'],
    ['ambiente-externo2', 'O pavilhão'], ['smoothie-verao', 'Smoothie de verão'], ['cogumelo-toast', 'Toast de cogumelos'], ['panqueca', 'Pancake Red Fruit'],
    ['queijo-quente2', 'Queijo Quente'], ['ambiente-externo3', 'Mesas sob o pavilhão'], ['lunch-time', 'Lunch'], ['cafe-da-manha3', 'Café da manhã'],
    ['torta-maca', 'Sobremesa'], ['smoohtie-nuvem', 'Smoothie Nuvem'], ['brunch', 'Brunch para dividir'], ['ambiente-externo', 'Varanda verde'],
  ];
  const WIDE = new Set(['bowl-aurora', 'salmao-sour', 'smoothie-verao', 'cogumelo-toast', 'lunch-time']);
  const loopEl = $('#loop'), loopTrack = $('#loopTrack');
  const shotHTML = ([f, c]) => `<figure class="shot"><div class="shot__img"><img src="img/b/${f}-sm.webp" srcset="img/b/${f}-sm.webp ${WIDE.has(f) ? 640 : 427}w, img/b/${f}.webp ${WIDE.has(f) ? 1080 : 934}w" sizes="(min-width:760px) 360px, 75vw" alt="${esc(c)}" loading="lazy" decoding="async" draggable="false"></div><figcaption>${esc(c)}</figcaption></figure>`;
  loopTrack.innerHTML = GAL.map(shotHTML).join('') + GAL.map(shotHTML).join('');
  $$('.shot', loopTrack).slice(GAL.length).forEach((f) => f.setAttribute('aria-hidden', 'true'));
  (function loop() {
    const shots = $$('.shot', loopTrack);
    let x = 0, v = 0, setW = 0, dragging = false, lastX = 0, lastT = 0, moved = 0, resumeAt = 0, hover = false, visible = false, raf = 0, prev = 0;
    const SPEED = innerWidth < 760 ? 34 : 46; // px/s
    const imgs = shots.map((s) => s.querySelector('img'));
    let step = 0, cardW = 0, baseLeft = 0;
    const measure = () => {
      const a = shots[0], b = shots[1], c = shots[GAL.length];
      setW = c.offsetLeft - a.offsetLeft; step = b.offsetLeft - a.offsetLeft; cardW = a.offsetWidth;
      baseLeft = loopEl.getBoundingClientRect().left + a.offsetLeft;
    };
    measure(); addEventListener('resize', measure);
    if (document.fonts) document.fonts.ready.then(measure);
    function frame(t) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - (prev || t)) / 1000); prev = t;
      if (!dragging) {
        const auto = reduced || t < resumeAt ? 0 : (hover ? 0.25 : 1) * SPEED;
        v += (-auto - v) * Math.min(1, dt * 2.2); // ritmo volta suave depois de soltar
        x += v * dt;
      }
      if (setW) { while (x <= -setW) x += setW; while (x > 0) x -= setW; }
      loopTrack.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      const vw = innerWidth;
      for (let i = 0; i < imgs.length; i++) { // parallax calculado, sem medir o layout a cada quadro
        const cx = baseLeft + x + i * step + cardW / 2;
        if (cx < -cardW || cx > vw + cardW) continue;
        imgs[i].style.setProperty('--px', (-8 - ((cx - vw / 2) / vw) * 7).toFixed(2) + '%');
      }
    }
    const start = () => { if (!raf) { prev = 0; raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible && !document.hidden ? start() : stop(); }).observe(loopEl);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : visible && start()));
    loopEl.addEventListener('pointerdown', (e) => {
      dragging = true; moved = 0; lastX = e.clientX; lastT = performance.now(); v = 0;
      loopEl.classList.add('dragging'); try { loopEl.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    });
    loopEl.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now(), dx = e.clientX - lastX;
      x += dx; moved += Math.abs(dx);
      v = 0.8 * (dx / Math.max(1, now - lastT)) * 1000 + 0.2 * v;
      lastX = e.clientX; lastT = now;
    });
    const end = () => { if (!dragging) return; dragging = false; loopEl.classList.remove('dragging'); resumeAt = performance.now() + 1400; };
    loopEl.addEventListener('pointerup', end); loopEl.addEventListener('pointercancel', end); loopEl.addEventListener('lostpointercapture', end);
    loopEl.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    loopEl.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hover = true; });
    loopEl.addEventListener('pointerleave', () => { hover = false; });
  })();

  // =========================================================
  // VISITE
  // =========================================================
  $('#copyAddr').addEventListener('click', async () => {
    const addr = 'Botanikafé, Av. Pedro Álvares Cabral, s/n, Pavilhão da Bienal, Parque Ibirapuera, São Paulo, SP, 04094-000';
    try { await navigator.clipboard.writeText(addr); toast('Endereço copiado'); } catch (e) { toast(addr); }
  });
  if (finePointer && !reduced) {
    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1)}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // =========================================================
  // ANIMAÇÕES
  // =========================================================
  function intro() {
    const el = $('.intro');
    if (!hasGSAP || reduced) { if (el) el.remove(); dock.classList.remove('pre'); heroIn(); return; }
    const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
    gsap.set('.intro', { clipPath: 'circle(150% at 50% 46%)' });
    gsap.set('.intro__word', { y: 12 });
    tl.set('.intro__grow', { attr: { y: 1397, height: 0 } })
      .to('.intro__grow', { attr: { y: 0, height: 1397 }, duration: 1.1, ease: 'power3.inOut' })
      .fromTo('.intro__logo', { scale: 0.85, rotate: -6 }, { scale: 1, rotate: 0, duration: 1.1, ease: 'expo.out' }, 0)
      .to('.intro__word', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.5)
      .to('.intro', { clipPath: 'circle(0% at 50% 46%)', duration: 0.85 }, 1.35)
      .add(() => heroIn(), 1.5)
      .add(() => el && el.remove());
  }
  function heroIn() {
    if (!hasGSAP || reduced) return;
    if (scrollY > 20) { dock.classList.remove('pre'); window.dispatchEvent(new Event('btk-hero-in')); return; }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero__title .w', { yPercent: 115, rotate: 7, duration: 1.3, stagger: 0.07 })
      .from('.hero__sub', { opacity: 0, y: 20, duration: 1 }, 0.35)
      .from('.hsearch', { opacity: 0, y: 26, duration: 1.1 }, 0.45)
      .from('.hero__cta', { opacity: 0, y: 14, duration: 1 }, 0.6)
      .from('.hdr', { opacity: 0, duration: 0.9 }, 0.2)
      .add(() => dock.classList.remove('pre'), 0.6);
    window.dispatchEvent(new Event('btk-hero-in'));
  }

  // A porta: o logo vira chave, gira e abre o cardápio
  if (gateOn) {
    const W = (sel) => $$(sel);
    const gate = gsap.timeline({ paused: true, defaults: { ease: 'none', immediateRender: false } });
    gate
      .fromTo(W('.hero__title .w'), { yPercent: 0, opacity: 1 }, { yPercent: -120, opacity: 0, stagger: 0.012, duration: 0.14, ease: 'power2.in' }, 0.02)
      .fromTo(W('.hero__sub, .hsearch, .hero__cta'), { y: 0, autoAlpha: 1 }, { y: 26, autoAlpha: 0, stagger: 0.02, duration: 0.12, ease: 'power2.in' }, 0)
      .fromTo('.brand__logo', { opacity: 1 }, { opacity: 0, duration: 0.05 }, 0.1)
      .fromTo('.gate__glow', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.16, ease: 'power2.out' }, 0.22)
      .fromTo('.door__seam', { scaleY: 0, opacity: 1 }, { scaleY: 1, duration: 0.12, ease: 'power2.out' }, 0.3)
      .fromTo('.gate__pulse', { scale: 0.35, opacity: 0 }, { scale: 0.5, opacity: 0.9, duration: 0.02 }, 0.48)
      .to('.gate__pulse', { scale: 2.3, opacity: 0, duration: 0.1, ease: 'power2.out' }, 0.5)
      .fromTo('.door--l', { rotateY: 0 }, { rotateY: 96, duration: 0.34, ease: 'power2.in' }, 0.54)
      .fromTo('.door--r', { rotateY: 0 }, { rotateY: -96, duration: 0.34, ease: 'power2.in' }, 0.54)
      .fromTo('.door', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.07 }, 0.83)
      .fromTo('.door__shade', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.54)
      .to('.door__seam', { opacity: 0, duration: 0.05 }, 0.55)
      .to('.gate__glow', { opacity: 0, duration: 0.12 }, 0.72)
      .fromTo('.brand__logo', { opacity: 0, scale: 1.45 }, { opacity: 1, scale: 1, duration: 0.06, ease: 'back.out(2)' }, 0.86)
      .fromTo('.hero__gl', { opacity: 1 }, { opacity: 0, duration: 0.1 }, 0.86)
      .to('.hero__fallback', { opacity: 0, duration: 0.08 }, 0.14)
      .to({}, { duration: 0.001 }, 0.999);
    let burstDone = false;
    ScrollTrigger.create({
      trigger: '.gate', start: 'top top', end: () => '+=' + Math.max(1, $('.gate').offsetHeight - $('.gate__stage').offsetHeight), scrub: lenis ? true : 0.35, animation: gate, invalidateOnRefresh: true,
      onUpdate: (st) => {
        const p = gate.progress();
        if (!burstDone && p > 0.56 && st.direction > 0) { burstDone = true; FX.burst(innerWidth / 2, innerHeight * 0.48, 9, 1.5); }
        if (p < 0.4) burstDone = false;
      },
    });
    window.BTK_GATE = () => gate.progress();
  }

  if (hasGSAP && !reduced) {
    // novidades entram com profundidade
    gsap.from('.ncard', { y: 60, rotateX: -22, opacity: 0, transformPerspective: 900, transformOrigin: '50% 100%', stagger: 0.09, duration: 1.1, ease: 'expo.out', clearProps: 'transform,opacity',
      scrollTrigger: { trigger: '#novidades', start: 'top 85%', once: true, onEnter: () => {
        FX.gust(1, 4, 0.2, 0.5);
        if (innerWidth < 1024 && newsTrack.scrollWidth > newsTrack.clientWidth) setTimeout(() => { newsTrack.scrollBy({ left: 70, behavior: 'smooth' }); setTimeout(() => newsTrack.scrollBy({ left: -70, behavior: 'smooth' }), 650); }, 900);
      } } });
    gsap.from('.menu__head > *', { opacity: 0, y: 30, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.menu__head', start: 'top 85%', once: true } });
    gsap.from('.gallery .sechead__title', { opacity: 0, y: 40, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.gallery', start: 'top 80%', once: true, onEnter: () => FX.gust(-1, 5, 0.15, 0.55) } });
    gsap.from('.shot', { opacity: 0, y: 50, stagger: 0.05, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.loop', start: 'top 90%', once: true } });
    gsap.from('.visit__card', { scale: 0.94, opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.visit', start: 'top 80%', once: true, onEnter: () => FX.fall(4) } });
    gsap.from('.visit__map img', { scale: 1.3, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.visit__map', start: 'top 85%', once: true } });
    const big = $('.ftr__big');
    if (big) {
      big.innerHTML = '<em class="ch">B</em>' + 'otanikafé'.split('').map((ch) => `<span class="ch">${ch}</span>`).join('');
      $$('.ftr__big .ch').forEach((c) => (c.style.display = 'inline-block'));
      gsap.from('.ftr__big .ch', { yPercent: 100, rotate: 12, opacity: 0, stagger: 0.04, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ftr', start: 'top 85%', once: true } });
    }
  }

  // ---------- início ----------
  if (!location.hash || /^#item-/.test(location.hash)) window.scrollTo(0, 0);
  else setTimeout(() => goTo(location.hash, 1), 120);
  let started = false;
  const go = () => { if (started) return; started = true; intro(); };
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(go);
  setTimeout(() => { const el = $('.intro'); if (el) el.remove(); }, 4500);
})();
