/* =========================================================
   Botanikafé · Café Bienal — interface e animações
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const hasGSAP = !!window.gsap;
  const MENU = window.MENU;
  const S = window.SmartSearch;
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

  // índice de itens
  const BY_ID = new Map();
  MENU.cats.forEach((cat) => cat.secs.forEach((sec) => sec.items.forEach((it) => BY_ID.set(it.id, { it, cat, sec }))));
  S.build(MENU);

  function priceHTML(it) {
    if (!it.p) return '';
    if (it.s && it.s.length > 1) return `<span class="price"><small>a partir de</small>${fmt(Math.min(...it.s.map((s) => s.p)))}</span>`;
    if (it.s && it.s.length === 1 && it.s[0].l) return `<span class="price">${fmt(it.s[0].p)} <small>${esc(it.s[0].l)}</small></span>`;
    return `<span class="price">${fmt(it.p)}</span>`;
  }

  // ---------- toast ----------
  const toastEl = $('#toast'); let toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200); }

  // ---------- smooth scroll (desktop) ----------
  let lenis = null;
  if (window.Lenis && finePointer && !reduced) {
    lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    if (hasGSAP) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
    }
  } else if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  function scrollToEl(el, offset) {
    if (!el) return;
    const off = offset != null ? offset : -(parseInt(getComputedStyle(root).getPropertyValue('--hdr-h')) + 70);
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.2 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + off, behavior: reduced ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = $(id); if (!el) return;
    e.preventDefault(); scrollToEl(el, id === '#inicio' ? 0 : id === '#refugio' ? 0 : undefined);
  }));

  function lockScroll(on) {
    root.style.overflow = on ? 'hidden' : '';
    window.dispatchEvent(new Event(on ? 'btk-pause' : 'btk-resume'));
    if (lenis) on ? lenis.stop() : lenis.start();
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
    store.set('btk-theme-v', 1);
    try { localStorage.setItem('btk-theme', next); } catch (err) { /* ok */ }
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

  // ---------- status aberto/fechado (horário de São Paulo) ----------
  function updateStatus() {
    let h = 0, m = 0;
    try {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      h = +parts.find((p) => p.type === 'hour').value % 24; m = +parts.find((p) => p.type === 'minute').value;
    } catch (e) { const d = new Date(); h = d.getHours(); m = d.getMinutes(); }
    const now = h * 60 + m, open = 8 * 60, close = 18 * 60 + 30;
    let txt, cls;
    if (now >= open && now < close) {
      const left = close - now;
      if (left <= 45) { txt = `Fecha em ${left} min · até 18h30`; cls = 'is-soon'; } else { txt = 'Aberto agora · até 18h30'; cls = 'is-open'; }
    } else if (now < open && open - now <= 60) { txt = `Abre em ${open - now} min · 08h`; cls = 'is-soon'; }
    else { txt = 'Fechado agora · abre às 08h'; cls = ''; }
    $$('[data-status]').forEach((el) => { el.classList.remove('is-open', 'is-soon'); if (cls) el.classList.add(cls); $('.status__txt', el).textContent = txt; });
  }
  updateStatus(); setInterval(updateStatus, 60000);

  // ---------- header / dock ----------
  const hdr = $('#hdr'), dock = $('.dock');
  if (hasGSAP && !reduced) dock.classList.add('pre');
  let lastY = scrollY;
  function onScroll() {
    const y = scrollY;
    hdr.classList.toggle('scrolled', y > 30);
    if (Math.abs(y - lastY) > 6) { dock.classList.toggle('hide', y > lastY && y > 600); lastY = y; }
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const navSections = ['inicio', 'destaques', 'cardapio', 'galeria', 'visite'].map((id) => document.getElementById(id));
  const navIO = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      $$('.dock a').forEach((a) => a.classList.toggle('active', a.dataset.dock === id || (id === 'destaques' && a.dataset.dock === 'inicio')));
      $$('.hdr__nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navSections.forEach((s) => s && navIO.observe(s));

  // ---------- placeholder digitando ----------
  const typedEl = $('#typed');
  const PH = ['matcha gelado', 'vegano até R$ 40', 'drink com tequila', 'algo sem glúten', 'café da manhã', 'beneditino sem salmão', 'doce vegano'];
  if (!reduced) {
    let pi = 0, ci = PH[0].length, del = true;
    const tick = () => {
      const w = PH[pi];
      if (del) { ci--; if (ci <= 0) { del = false; pi = (pi + 1) % PH.length; } }
      else { ci++; if (ci >= PH[pi].length) { del = true; typedEl.textContent = PH[pi]; return setTimeout(tick, 1900); } }
      typedEl.textContent = PH[pi].slice(0, Math.max(0, ci)) || '​';
      setTimeout(tick, del ? 38 : 72);
    };
    setTimeout(tick, 2600);
  }

  // =========================================================
  // CARDÁPIO
  // =========================================================
  const tabsEl = $('#tabs'), listEl = $('#menuList'), ink = $('.tabs__ink');
  let total = 0;
  MENU.cats.forEach((c) => c.secs.forEach((s) => (total += s.items.length)));
  $('#menuCount').textContent = total;

  tabsEl.insertAdjacentHTML('beforeend', MENU.cats.map((c, i) => `<button class="tab" role="tab" type="button" aria-selected="${i === 0}" aria-controls="cat-${c.id}" data-cat="${c.id}">${esc(c.n)}</button>`).join(''));

  const itemHTML = (it) => `<li><button class="item rv" type="button" data-id="${it.id}" data-tags="${esc((it.t || []).join('|'))}">
      <span class="item__body"><span class="item__name">${esc(it.n)}</span>${it.d ? `<span class="item__desc">${esc(it.d)}</span>` : ''}
      <span class="item__meta">${priceHTML(it)}${(it.t || []).map(tagHTML).join('')}</span></span>
      ${it.i ? `<span class="item__media"><img src="${it.i}" alt="" loading="lazy" decoding="async" width="104" height="104" onload="this.classList.add('loaded')"></span>`
             : `<span class="item__media item__media--empty"><svg aria-hidden="true"><use href="#logo"/></svg></span>`}
    </button></li>`;

  listEl.innerHTML = MENU.cats.map((c) => `
    <section class="mcat" id="cat-${c.id}" data-cat="${c.id}" aria-labelledby="h-${c.id}">
      <div class="mcat__head rv"><h3 class="mcat__title" id="h-${c.id}">${esc(c.n)}</h3><p class="mcat__sub">${esc(c.id === 'foam' ? 'Edição sazonal' : c.sub)}</p></div>
      ${c.secs.map((s) => `<div class="msec">
        ${c.secs.length > 1 || s.n !== c.n ? `<h4 class="msec__title">${esc(s.n)}</h4>` : ''}
        ${s.d && c.id !== 'foam' ? `<p class="msec__desc">${esc(s.d)}</p>` : ''}
        <ul class="items">${s.items.map(itemHTML).join('')}</ul></div>`).join('')}
    </section>`).join('');

  // reveal com IntersectionObserver (robusto e barato)
  const revealIO = new IntersectionObserver((ents) => {
    let i = 0;
    ents.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target; el.style.transitionDelay = Math.min(i++ * 45, 360) + 'ms';
      el.classList.add('in'); revealIO.unobserve(el);
      setTimeout(() => { el.style.transitionDelay = ''; }, 1200);
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  const css = document.createElement('style');
  css.textContent = '.js .rv{transition:opacity .7s,transform .9s var(--ease-out)}.js .rv.in{opacity:1;transform:none}';
  document.head.appendChild(css);
  if (reduced) $$('.rv').forEach((el) => el.classList.add('in')); else $$('.rv').forEach((el) => revealIO.observe(el));

  // tabs: tinta deslizante + seção ativa
  function moveInk(btn) {
    if (!btn) return;
    ink.style.width = btn.offsetWidth + 'px';
    ink.style.transform = `translateX(${btn.offsetLeft}px)`;
    const target = btn.offsetLeft - tabsEl.clientWidth / 2 + btn.offsetWidth / 2;
    tabsEl.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' });
  }
  function setActiveTab(id) {
    $$('.tab', tabsEl).forEach((b) => { const on = b.dataset.cat === id; b.setAttribute('aria-selected', on); if (on) moveInk(b); });
  }
  let tabLock = 0;
  tabsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.tab'); if (!b) return;
    setActiveTab(b.dataset.cat); tabLock = Date.now() + 1300;
    scrollToEl($('#cat-' + b.dataset.cat), -(parseInt(getComputedStyle(root).getPropertyValue('--hdr-h')) + 64));
  });
  const catIO = new IntersectionObserver((ents) => {
    if (Date.now() < tabLock) return;
    ents.forEach((en) => { if (en.isIntersecting) setActiveTab(en.target.dataset.cat); });
  }, { rootMargin: '-30% 0px -65% 0px' });
  $$('.mcat').forEach((s) => catIO.observe(s));
  requestAnimationFrame(() => moveInk($('.tab', tabsEl)));
  addEventListener('resize', () => moveInk($('.tab[aria-selected="true"]', tabsEl)));
  if (document.fonts) document.fonts.ready.then(() => moveInk($('.tab[aria-selected="true"]', tabsEl)));

  // filtros alimentares
  const FILTERS = [
    { id: 'vegano', label: '🌱 Vegano', tags: ['Vegano'] },
    { id: 'veg', label: 'Vegetariano', tags: ['Vegetariano', 'Vegano'] },
    { id: 'sg', label: 'Sem glúten', tags: ['Sem Gluten'] },
    { id: 'sl', label: 'Sem lactose', tags: ['Sem Lactose'] },
    { id: 'hot', label: '🌶 Picante', tags: ['Apimentado', 'Levemente Apimentado'] },
  ];
  const active = new Set();
  $('#filters').insertAdjacentHTML('beforeend', FILTERS.map((f) => `<button class="chip" type="button" aria-pressed="false" data-f="${f.id}">${f.label}</button>`).join(''));
  $('#filters').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const id = b.dataset.f; active.has(id) ? active.delete(id) : active.add(id);
    b.setAttribute('aria-pressed', active.has(id));
    applyFilters();
  });
  function applyFilters() {
    const fs = FILTERS.filter((f) => active.has(f.id));
    let n = 0;
    $$('.item', listEl).forEach((el) => {
      const tags = el.dataset.tags ? el.dataset.tags.split('|') : [];
      const ok = fs.every((f) => tags.some((t) => f.tags.includes(t)));
      el.parentElement.classList.toggle('is-hidden', !ok); el.classList.toggle('is-hidden', !ok);
      if (ok) { n++; el.classList.add('in'); }
    });
    $$('.msec', listEl).forEach((s) => s.classList.toggle('is-hidden', !$('.item:not(.is-hidden)', s)));
    $$('.mcat', listEl).forEach((s) => s.classList.toggle('is-hidden', !$('.item:not(.is-hidden)', s)));
    $$('.tab', tabsEl).forEach((t) => { const c = $('#cat-' + t.dataset.cat); t.hidden = c.classList.contains('is-hidden'); });
    $('#filterResult').innerHTML = fs.length ? `${n} ${n === 1 ? 'item' : 'itens'} · ${fs.map((f) => f.label.replace(/^\S+\s(?=\S)/u, (m) => (/\p{Emoji_Presentation}/u.test(m) ? '' : m))).join(' + ')} <button class="link" type="button" id="clearF">limpar</button>` : '';
    const cf = $('#clearF'); if (cf) cf.onclick = () => { active.clear(); $$('#filters .chip').forEach((c) => c.setAttribute('aria-pressed', 'false')); applyFilters(); };
    if (hasGSAP) ScrollTrigger.refresh();
    const vis = $('.tab:not([hidden])', tabsEl); if (vis) setActiveTab(vis.dataset.cat);
  }

  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('.item'); if (!b) return;
    openItem(b.dataset.id, $('img', b));
  });

  // =========================================================
  // FOAM SEASON — cards que viram em 3D
  // =========================================================
  const foam = MENU.cats.find((c) => c.id === 'foam');
  if (foam) {
    $('#flips').innerHTML = foam.secs[0].items.map((it, i) => `
      <div class="flip rv" style="--i:${i}">
        <button class="flip__inner" type="button" aria-label="${esc(it.n)} — virar card">
          <span class="flip__face flip__front"><img src="${it.i}" alt="${esc(it.n)}" loading="lazy">
            <span class="flip__label"><strong>${esc(it.n)}</strong><span>Toque ↻</span></span></span>
          <span class="flip__face flip__back"><svg aria-hidden="true"><use href="#logo"/></svg>
            <h3>${esc(it.n)}</h3><p>${esc(it.d)}</p><span class="price">${fmt(it.p)}</span></span>
        </button>
      </div>`).join('');
    $$('#flips .rv').forEach((el) => (reduced ? el.classList.add('in') : revealIO.observe(el)));
    $('#flips').addEventListener('click', (e) => { const f = e.target.closest('.flip'); if (f) f.classList.toggle('is-flipped'); });
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
  // BUSCA INTELIGENTE
  // =========================================================
  const searchEl = $('#search'), qEl = $('#q'), resultsEl = $('#results'), intentEl = $('#intent');
  const SUGS = ['matcha gelado', 'vegano até R$ 40', 'café da manhã', 'drink com tequila', 'sem glúten', 'algo barato', 'doce vegano', 'almoço picante', 'vinho tinto', 'beneditino sem salmão', 'smoothie proteico', 'cold brew'];
  $('#sugs').innerHTML = SUGS.map((s) => `<button class="chip" type="button" data-q="${esc(s)}">${esc(s)}</button>`).join('');
  const CAT_IMG = { brunch: 'img/b/mesa-brunch-sm.webp', lunch: 'img/b/lunch-time-sm.webp', cafe: 'img/b/cafe-da-manha3-sm.webp', sucos: 'img/b/smoothie-verao-sm.webp', doces: 'img/b/torta-maca-sm.webp' };
  $('#searchCats').innerHTML = MENU.cats.map((c) => {
    const img = CAT_IMG[c.id] || (c.secs.flatMap((s) => s.items).find((i) => i.i) || {}).i;
    return `<button class="scat" type="button" data-cat="${c.id}"><img src="${img}" alt="" loading="lazy"><span>${esc(c.n)}</span></button>`;
  }).join('');
  let disabled = new Set(), kbIdx = -1, lastResults = [];

  function renderRecent() {
    const rec = store.get('btk-recent') || [];
    $('#recentWrap').hidden = !rec.length;
    $('#recent').innerHTML = rec.map((s) => `<button class="chip" type="button" data-q="${esc(s)}">↺ ${esc(s)}</button>`).join('');
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
      gsap.fromTo('.search__panel', desk ? { opacity: 0, y: -18, scale: 0.97 } : { yPercent: 100 }, desk ? { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'expo.out', clearProps: 'opacity,scale' } : { yPercent: 0, duration: 0.55, ease: 'expo.out' });
      gsap.fromTo('.search__empty > *', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, delay: 0.12, ease: 'power3.out' });
    }
    setTimeout(() => qEl.focus({ preventScroll: true }), 60);
  }
  function closeSearchUI() {
    if (searchEl.hidden) return;
    const done = () => { searchEl.hidden = true; lockScroll(false); stopVoice(); };
    if (hasGSAP && !reduced) {
      const desk = innerWidth >= 760;
      gsap.to('.search__backdrop', { opacity: 0, duration: 0.25 });
      gsap.to('.search__panel', desk ? { opacity: 0, y: -10, scale: 0.98, duration: 0.25, onComplete: done } : { yPercent: 100, duration: 0.35, ease: 'power3.in', onComplete: done });
    } else done();
  }
  $$('[data-open-search]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); openSearch(b.dataset.q); }));
  $$('.quick .chip').forEach((b) => b.addEventListener('click', () => openSearch(b.dataset.q)));
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
    if (cat) { popLayer('search'); setTimeout(() => scrollToEl($('#cat-' + cat.dataset.cat)), 380); return; }
    const x = e.target.closest('[data-unchip]');
    if (x) { disabled.add(x.dataset.unchip); runSearch(); return; }
    const sug = e.target.closest('[data-sug]');
    if (sug) { qEl.value = sug.dataset.sug; runSearch(); return; }
    const res = e.target.closest('.res');
    if (res) { saveRecent(qEl.value); openItem(res.dataset.id, $('img', res), true); }
  });

  function hl(name, set) {
    if (!set || !set.size) return esc(name);
    return name.split(/(\s+)/).map((tok) => { const n = S.norm(tok).replace(/[^a-z0-9]/g, ''); return n && set.has(n) ? `<mark>${esc(tok)}</mark>` : esc(tok); }).join('');
  }
  function runSearch() {
    const q = qEl.value.trim(); kbIdx = -1;
    searchEl.classList.toggle('has-q', !!q);
    if (!q) { intentEl.innerHTML = ''; resultsEl.innerHTML = ''; return; }
    const r = S.search(q, { disabled });
    lastResults = r.results;
    intentEl.innerHTML = r.intent.chips.length
      ? `<span class="ichip ichip--lead"><svg><use href="#i-sparkle"/></svg>Entendi:</span>` + r.intent.chips.map((c) => `<span class="ichip">${esc(c.label)}<button type="button" data-unchip="${esc(c.label)}" aria-label="Remover ${esc(c.label)}"><svg><use href="#i-x"/></svg></button></span>`).join('')
      : '';
    if (!r.results.length) {
      resultsEl.innerHTML = `<li class="noresults"><svg aria-hidden="true"><use href="#logo"/></svg><p>Nada encontrado para <strong>“${esc(q)}”</strong>.</p>
        ${r.suggestion ? `<p>Você quis dizer <button class="chip" type="button" data-sug="${esc(r.suggestion)}">${esc(r.suggestion)}</button>?</p>` : ''}
        <p>Tente: ${['matcha', 'vegano', 'até R$ 30', 'pancake'].map((s) => `<button class="chip" type="button" data-sug="${s}">${s}</button>`).join('')}</p></li>`;
      return;
    }
    const n = r.results.length;
    resultsEl.innerHTML = `<li class="results__meta"><strong>${n}</strong> ${n === 1 ? 'resultado' : 'resultados'}${r.relaxed ? ' parecidos' : ''}</li>` +
      r.results.slice(0, 60).map((x, i) => `<li class="res" role="option" data-id="${x.item.id}" style="animation-delay:${Math.min(i * 22, 300)}ms">
        ${x.item.i ? `<img class="res__img" src="${x.item.i}" alt="" loading="lazy">` : `<span class="res__img"></span>`}
        <span class="res__t"><span class="res__n">${hl(x.item.n, x.hl)}</span><span class="res__c">${esc([x.cat.n].concat(x.also).join(' · '))} › ${esc(x.sec.n)}${x.item.t && x.item.t.length ? ' · ' + x.item.t.map((t) => (TAGS[t] || [t])[0]).join(', ') : ''}</span></span>
        <span class="res__p">${x.item.p ? (x.item.s && x.item.s.length > 1 ? 'a partir de ' : '') + fmt(x.item.s && x.item.s.length > 1 ? Math.min(...x.item.s.map((s) => s.p)) : x.item.p) : ''}</span></li>`).join('');
  }

  // busca por voz
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
  function stopVoice() { if (rec) { try { rec.stop(); } catch (e) { /* ok */ } } rec = null; micBtn.classList.remove('listening'); qEl.placeholder = 'O que você quer hoje?'; }

  // =========================================================
  // BOTTOM SHEET DO ITEM
  // =========================================================
  const sheet = $('#sheet'), panel = $('#sheetPanel'), sImg = $('#sheetImg'), sMedia = $('#sheetMedia');
  let currentId = null;
  function fillSheet(id) {
    const rec = BY_ID.get(id); if (!rec) return false;
    const { it, cat, sec } = rec; currentId = id;
    $('#sheetCrumb').textContent = cat.n + (sec.n !== cat.n ? ' · ' + sec.n : '');
    $('#sheetName').textContent = it.n;
    $('#sheetDesc').textContent = it.d || '';
    $('#sheetTags').innerHTML = (it.t || []).map(tagHTML).join('');
    let opts = '';
    if (it.s && (it.s.length > 1 || it.s[0].l)) opts += `<div class="opt"><h4>${cat.id === 'vinhos' ? 'Garrafa' : 'Tamanhos'}</h4><ul>${it.s.map((s) => `<li><span>${esc(s.l || 'Padrão')}${s.o ? `<small>${esc(s.o)}</small>` : ''}</span><b>${fmt(s.p)}</b></li>`).join('')}</ul></div>`;
    (it.x || []).forEach((g) => { if (g.c.length) opts += `<div class="opt"><h4>${esc(g.g || 'Opções')}</h4><ul>${g.c.map((c) => `<li><span>${esc(c.l)}</span><b>${c.p ? fmt(c.p) : ''}</b></li>`).join('')}</ul></div>`; });
    $('#sheetOpts').innerHTML = opts;
    const multi = it.s && it.s.length > 1;
    $('#sheetPrice').innerHTML = it.p ? `<small>${multi ? 'a partir de' : 'preço'}</small>${fmt(multi ? Math.min(...it.s.map((s) => s.p)) : it.p)}` : '<small>preço</small>consulte';
    if (it.i) { sMedia.classList.remove('empty'); sImg.hidden = false; sImg.src = it.i; sImg.alt = it.n; }
    else { sMedia.classList.add('empty'); sImg.hidden = true; sImg.removeAttribute('src'); }
    return true;
  }
  function openItem(id, fromImg, fromSearch) {
    if (!fillSheet(id)) return;
    if (fromSearch && !searchEl.hidden) {
      searchEl.hidden = true; stopVoice();
      layers[layers.length - 1] = 'sheet'; history.replaceState({ layer: 'sheet' }, '', '#item-' + id);
    } else pushLayer('sheet', '#item-' + id);
    sheet.hidden = false; lockScroll(true); panel.scrollTop = 0;
    if (!hasGSAP || reduced) return;
    const desk = innerWidth >= 760;
    gsap.fromTo('.sheet__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.35 });
    gsap.fromTo(panel, desk ? { opacity: 0, scale: 0.94, xPercent: -50, yPercent: -46 } : { y: '100%' },
      desk ? { opacity: 1, scale: 1, xPercent: -50, yPercent: -50, duration: 0.6, ease: 'expo.out' } : { y: '0%', duration: 0.6, ease: 'expo.out' });
    gsap.fromTo('.sheet__content > *', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, delay: 0.15, ease: 'power3.out' });
    // voo da imagem (FLIP)
    if (fromImg && fromImg.complete && !sImg.hidden) {
      const a = fromImg.getBoundingClientRect();
      requestAnimationFrame(() => {
        const b = sMedia.getBoundingClientRect();
        const fly = document.createElement('img'); fly.src = fromImg.currentSrc || fromImg.src; fly.className = 'flyimg';
        Object.assign(fly.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
        document.body.appendChild(fly); sImg.style.opacity = 0;
        const endTop = desk ? b.top : innerHeight - panel.offsetHeight + b.top - panel.getBoundingClientRect().top;
        gsap.to(fly, { left: b.left, top: endTop, width: b.width, height: b.height, borderRadius: desk ? 0 : 28, duration: 0.6, ease: 'expo.out',
          onComplete: () => { sImg.style.opacity = 1; fly.remove(); } });
      });
    }
  }
  function closeSheetUI() {
    if (sheet.hidden) return;
    const done = () => { sheet.hidden = true; lockScroll(false); gsap && gsap.set && gsap.set(panel, { clearProps: 'all' }); currentId = null; };
    if (!hasGSAP || reduced) return done();
    const desk = innerWidth >= 760;
    gsap.to('.sheet__backdrop', { opacity: 0, duration: 0.3 });
    gsap.to(panel, desk ? { opacity: 0, scale: 0.96, duration: 0.25, onComplete: done } : { y: '100%', duration: 0.38, ease: 'power3.in', onComplete: done });
  }
  $$('[data-close-sheet]').forEach((b) => b.addEventListener('click', () => popLayer('sheet')));
  $('#shareItem').addEventListener('click', async () => {
    const rec = BY_ID.get(currentId); if (!rec) return;
    const url = location.origin + location.pathname + '#item-' + currentId;
    const text = `${rec.it.n} — Botanikafé Café Bienal`;
    try {
      if (navigator.share) await navigator.share({ title: text, text, url });
      else { await navigator.clipboard.writeText(url); toast('Link copiado'); }
    } catch (e) { /* cancelado */ }
  });
  // arrastar para fechar (mobile)
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
      else if (hasGSAP) gsap.to(panel, { y: 0, duration: 0.4, ease: 'back.out(1.6)', onStart: () => { panel.style.transform = ''; } }), gsap.to('.sheet__backdrop', { opacity: 1, duration: 0.3 });
      else panel.style.transform = '';
    });
  })();
  // deep link #item-xxxx
  if (/^#item-/.test(location.hash)) {
    const id = location.hash.slice(6);
    if (BY_ID.has(id)) { history.replaceState(null, '', location.pathname + location.search); setTimeout(() => openItem(id), 900); }
  }

  // =========================================================
  // GALERIA — coverflow 3D
  // =========================================================
  const GAL = [
    ['ambiente-externo', 'O pavilhão e o gramado'], ['brunch', 'Brunch para dividir'], ['bowl-aurora', 'Bowl Aurora'], ['people', 'Encontros no parque'],
    ['salmao-sour', 'Salmão Sour'], ['mesa-brunch', 'Mesa de brunch'], ['smoothie-verao', 'Smoothie de verão'], ['ambiente-externo2', 'Varanda verde'],
    ['cogumelo-toast', 'Toast de cogumelos'], ['panqueca', 'Pancake de frutas vermelhas'], ['queijo-quente2', 'Queijo Quente'], ['ambiente-externo3', 'Mesas sob o pavilhão'],
    ['lunch-time', 'Lunch time'], ['cafe-da-manha3', 'Café da manhã'], ['torta-maca', 'Torta da casa'], ['smoohtie-nuvem', 'Smoothie Nuvem'],
  ];
  const track = $('#cfTrack'), cap = $('#cfCap');
  track.innerHTML = GAL.map(([f, c], i) => `<figure class="cf__card" data-i="${i}" data-cap="${esc(c)}"><img src="img/b/${f}-sm.webp" srcset="img/b/${f}-sm.webp 640w, img/b/${f}.webp 1400w" sizes="(min-width:1024px) 24vw, 62vw" alt="${esc(c)}" loading="lazy" draggable="false"></figure>`).join('');
  const cards = $$('.cf__card', track);
  let cfRaf = 0, cfCur = -1;
  function cfUpdate() {
    cfRaf = 0;
    const tr = track.getBoundingClientRect(); const cx = tr.left + tr.width / 2;
    let best = 0, bd = 1e9;
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect(); const d = (r.left + r.width / 2 - cx) / r.width;
      const ad = Math.abs(d); if (ad < bd) { bd = ad; best = i; }
      const rot = Math.max(-58, Math.min(58, -d * 42));
      c.style.transform = `translateZ(${-Math.min(ad, 3) * 140}px) rotateY(${rot}deg) scale(${1 - Math.min(ad, 2) * 0.06})`;
      c.style.zIndex = String(100 - Math.round(ad * 10));
      c.style.filter = `brightness(${1 - Math.min(ad, 2) * 0.18})`;
    });
    if (best !== cfCur) { cfCur = best; cap.textContent = cards[best].dataset.cap; }
  }
  const cfQueue = () => { if (!cfRaf) cfRaf = requestAnimationFrame(cfUpdate); };
  track.addEventListener('scroll', cfQueue, { passive: true }); addEventListener('resize', cfQueue);
  cfUpdate();
  const cfGo = (dir) => { const i = Math.max(0, Math.min(cards.length - 1, cfCur + dir)); centerCard(i); };
  function centerCard(i) { const c = cards[i]; track.scrollTo({ left: c.offsetLeft - (track.clientWidth - c.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' }); }
  $('.cf__nav--prev').addEventListener('click', () => cfGo(-1));
  $('.cf__nav--next').addEventListener('click', () => cfGo(1));
  track.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); cfGo(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); cfGo(-1); } });
  // arrastar com mouse
  (function () {
    let x0 = null, s0 = 0, moved = false;
    track.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; x0 = e.clientX; s0 = track.scrollLeft; moved = false; track.classList.add('dragging'); });
    addEventListener('pointermove', (e) => { if (x0 == null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = s0 - dx; });
    addEventListener('pointerup', () => { if (x0 == null) return; x0 = null; track.classList.remove('dragging'); centerCard(cfCur); });
    track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); return; } const c = e.target.closest('.cf__card'); if (c) centerCard(+c.dataset.i); });
  })();
  requestAnimationFrame(() => centerCard(2));

  // =========================================================
  // VISITE
  // =========================================================
  $('#copyAddr').addEventListener('click', async () => {
    const addr = 'Café Bienal — Botanikafé, Av. Pedro Álvares Cabral, s/n - Pavilhão da Bienal, Parque Ibirapuera, São Paulo - SP, 04094-000';
    try { await navigator.clipboard.writeText(addr); toast('Endereço copiado'); } catch (e) { toast(addr); }
  });

  // botões magnéticos (desktop)
  if (finePointer && !reduced) {
    $$('.magnetic, .hsearch').forEach((b) => {
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; b.style.transform = `translate(${x * 0.12}px, ${y * 0.22}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // =========================================================
  // ANIMAÇÕES (GSAP + ScrollTrigger)
  // =========================================================
  // separa palavras do manifesto
  const mf = $('[data-words]');
  if (mf) mf.innerHTML = mf.textContent.split(/\s+/).map((w) => `<span class="mw">${esc(w)}</span>`).join(' ');

  function intro() {
    const el = $('.intro');
    if (!hasGSAP || reduced) { el && el.remove(); dock.classList.remove('pre'); heroIn(); return; }
    const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
    tl.set('.intro__grow', { attr: { y: 1397, height: 0 } })
      .to('.intro__grow', { attr: { y: 0, height: 1397 }, duration: 1.15, ease: 'power3.inOut' })
      .fromTo('.intro__logo', { scale: 0.85, rotate: -6 }, { scale: 1, rotate: 0, duration: 1.15, ease: 'expo.out' }, 0)
      .to('.intro__word', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.55)
      .to('.intro', { clipPath: 'circle(0% at 50% 46%)', duration: 0.9 }, 1.45)
      .add(() => heroIn(), 1.6)
      .add(() => el.remove());
    gsap.set('.intro', { clipPath: 'circle(150% at 50% 46%)' });
    gsap.set('.intro__word', { y: 12 });
  }
  function heroIn() {
    if (!hasGSAP || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero__title .w', { yPercent: 115, rotate: 7, duration: 1.3, stagger: 0.07 })
      .from('.hero .status', { opacity: 0, y: -12, duration: 0.8 }, 0.1)
      .from('.hero__lede', { opacity: 0, y: 20, duration: 1 }, 0.45)
      .from('.hsearch', { opacity: 0, y: 30, scale: 0.96, duration: 1.1 }, 0.55)
      .from('.quick .chip', { opacity: 0, y: 14, duration: 0.8, stagger: 0.05 }, 0.7)
      .from('.hdr', { opacity: 0, duration: 0.9 }, 0.2)
      .add(() => dock.classList.remove('pre'), 0.6);
    window.dispatchEvent(new Event('btk-hero-in'));
  }

  if (hasGSAP && !reduced) {
    // hero: parallax ao rolar
    gsap.to('.hero__inner', { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // arco que se abre
    const desk = innerWidth >= 1024;
    const archTL = gsap.timeline({ scrollTrigger: { trigger: '.arch', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
    archTL.fromTo('.arch__frame', { clipPath: desk ? 'inset(14% 34% 8% 34% round 400px 400px 26px 26px)' : 'inset(16% 14% 16% 14% round 300px 300px 26px 26px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)', ease: 'power2.inOut', duration: 0.7 })
      .fromTo('.arch__img', { scale: 1.3 }, { scale: 1, ease: 'power2.inOut', duration: 0.7 }, 0)
      .fromTo('.arch__frame', { '--shade': 0 }, { '--shade': 1, duration: 0.3 }, 0.45)
      .to('.arch__caption', { opacity: 1, y: 0, duration: 0.3 }, 0.55)
      .to({}, { duration: 0.15 });

    // manifesto palavra por palavra
    gsap.to('.manifesto__txt .mw', { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.manifesto__txt', start: 'top 82%', end: 'bottom 40%', scrub: true } });
    gsap.from('.fact', { opacity: 0, y: 30, rotateX: -30, transformPerspective: 600, stagger: 0.1, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.facts', start: 'top 88%' } });
    // colagem com profundidade
    $$('.collage img').forEach((img) => {
      const sp = parseFloat(img.dataset.speed || 0);
      gsap.fromTo(img, { y: -sp * 300, rotate: sp * 10 }, { y: sp * 300, rotate: -sp * 10, ease: 'none', scrollTrigger: { trigger: '.collage', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from(img, { clipPath: 'inset(100% 0% 0% 0% round 20px)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: img, start: 'top 90%' } });
    });

    // títulos de seção
    $$('.sechead').forEach((h) => {
      gsap.from(h.children, { opacity: 0, y: 40, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
    });
    // banner com inclinação 3D
    gsap.fromTo('.feature__banner', { rotateX: 24, y: 60, transformPerspective: 900, transformOrigin: '50% 100%' }, { rotateX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: '.feature__banner', start: 'top bottom', end: 'top 45%', scrub: true } });
    gsap.from('.visit__card', { scale: 0.92, opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.visit', start: 'top 80%' } });
    gsap.from('.visit__map img', { scale: 1.35, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: '.visit__map', start: 'top 85%' } });
    // rodapé: letras em onda
    const big = $('.ftr__big');
    if (big) {
      big.innerHTML = big.innerHTML.replace(/<em>B<\/em>/, '<em class="ch">B</em>').replace(/(?<=<\/em>)([^<]+)/, (m) => m.split('').map((ch) => `<span class="ch" style="display:inline-block">${ch}</span>`).join(''));
      gsap.from('.ftr__big .ch', { yPercent: 100, rotate: 12, opacity: 0, stagger: 0.04, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ftr', start: 'top 85%' } });
      $$('.ftr__big .ch').forEach((c) => (c.style.display = 'inline-block'));
    }

    // marquee com velocidade do scroll
    const rows = $$('.marquee__row');
    rows.forEach((r) => { const s = r.firstElementChild; for (let i = 0; i < 3; i++) r.appendChild(s.cloneNode(true)); });
    const state = rows.map(() => ({ x: 0 }));
    let vel = 0;
    ScrollTrigger.create({ onUpdate: (self) => { vel = self.getVelocity(); } });
    gsap.ticker.add(() => {
      vel *= 0.9;
      rows.forEach((r, i) => {
        const w = r.firstElementChild.offsetWidth; if (!w) return;
        const dir = +r.dataset.dir;
        state[i].x -= dir * (0.6 + Math.min(Math.abs(vel) / 300, 8));
        if (state[i].x <= -w) state[i].x += w; if (state[i].x > 0) state[i].x -= w;
        r.style.transform = `translate3d(${state[i].x}px,0,0) skewX(${Math.max(-12, Math.min(12, -vel / 260 * dir))}deg)`;
      });
    });
  }

  // ---------- inicia ----------
  let started = false;
  const go = () => { if (started) return; started = true; intro(); };
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(go);
  // segurança: se a intro travar, some
  setTimeout(() => { const el = $('.intro'); if (el) el.remove(); }, 4500);
})();
