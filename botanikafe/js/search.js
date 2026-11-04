/* =========================================================
   Busca inteligente do cardápio — 100% no navegador
   Entende: preço ("até 40", "entre 20 e 35", "barato"),
   dieta ("vegano", "sem glúten"), temperatura, refeição,
   negação ("sem bacon"), sinônimos e erros de digitação.
   ========================================================= */
(function () {
  'use strict';

  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const words = (s) => norm(s).replace(/[^a-z0-9$]+/g, ' ').split(' ').filter(Boolean);

  // ---------- dicionários ----------
  const STOP = new Set('de da do das dos com e o a os as um uma uns umas para pra pro pros que quero queria queremos gostaria algo alguma algum alguns sem ate coisa coisas tem tenho voces vcs me mostra mostre mostrar ver opcao opcoes no na nos nas em por favor bem muito bom boa gostoso gostosa delicioso deliciosa tipo so ai hoje agora aqui la isso esse essa quais qual como pode ser bem mais menos to tô estou com fome fome ou r$ reais real conto pila preco valor custa custando voce pessoa pessoas verdade'.split(' '));

  // tags oficiais do cardápio
  const DIET = [
    { re: /\b(sem|zero|livre de|free)\s+(gluten|trigo)\b|\bgluten[\s-]?free\b|\bceliac[oa]s?\b/, tag: ['Sem Gluten'], label: 'Sem glúten' },
    { re: /\b(sem|zero|livre de)\s+lactose\b|\blactose[\s-]?free\b|\bintolerante\b/, tag: ['Sem Lactose'], label: 'Sem lactose' },
    { re: /\b(sem|zero)\s+acucar\b|\bsugar[\s-]?free\b|\bdiet\b/, tag: ['Sem açúcar'], label: 'Sem açúcar' },
    { re: /\bvegan[oa]?s?\b|\bplant[\s-]?based\b/, tag: ['Vegano'], label: 'Vegano' },
    { re: /\bvegetarian[oa]s?\b|\bveggie\b|\bsem carne\b|\bveg\b/, tag: ['Vegetariano', 'Vegano'], label: 'Vegetariano' },
    { re: /\bapimentad[oa]s?\b|\bpicante?s?\b|\bpimenta\b|\bspicy\b|\bardid[oa]\b/, tag: ['Apimentado', 'Levemente Apimentado'], label: 'Picante' },
  ];

  // conceitos → alternativas (palavras, seções ou categorias)
  const CONCEPTS = [
    { re: /\b(gelad[oa]s?|iced|ice|frio|fria|frios|refrescante|cold|geladinho)\b/, label: 'Gelado', alts: ['gelado', 'gelada', 'gelo', 'iced', 'cold', 'smoothie', 'suco', 'foam', 'lemonade', 'tonica', 'cha gelado', 'sec:cha gelado', 'sec:smoothie', 'sec:detox', 'cat:cervejas', 'sec:mocktail'] },
    { re: /\b(quente|quentinho|hot|esquentar)\b/, label: 'Quente', alts: ['quente', 'sec:espresso', 'sec:filtrado', 'sec:infusao', 'sec:lab', 'chai', 'latte', 'cappuccino', 'mocha'] },
    { re: /\bcafe da manha\b|\bbreakfast\b|\bde manha\b|\bmanha\b|\bmatinal\b/, label: 'Café da manhã', alts: ['sec:toast', 'sec:mexido', 'sec:pancake', 'sec:beneditino', 'sec:sanduba', 'sec:simples', 'sec:morning start', 'sec:bowl', 'sec:morning shot', 'sec:espresso', 'sec:filtrado', 'sec:lab', 'sec:suco simples'] },
    { re: /\bbrunch\b/, label: 'Brunch', alts: ['cat:brunch'] },
    { re: /\b(almoco|almocar|lunch)\b/, label: 'Almoço', alts: ['cat:lunch'] },
    { re: /\b(jantar|janta|dinner|noite)\b/, label: 'Jantar', alts: ['cat:dinner'] },
    { re: /\b(sobremesa|doce|doces|docinho|sweet|adocicad[oa])\b/, label: 'Doce', alts: ['cat:doces', 'sec:pancake', 'cookie', 'banana bread', 'brigadeiro', 'chocolate', 'doce de leite', 'mel', 'chantilly', 'calda'] },
    { re: /\bsem alcool\b|\bmocktail\b|\bzero alcool\b|\bnao alcoolic[oa]\b/, label: 'Sem álcool', alts: ['sec:mocktail', 'sec:suco simples', 'sec:detox', 'sec:cha gelado', 'sec:smoothie', 'sec:soft'], kill: /\b(drinks?|bebidas?)\b/ },
    { re: /\b(drinks?|alcool|alcoolic[oa]s?|coquetel|coqueteis|cocktail|birita|happy hour|bebida alcoolica|bebum)\b/, label: 'Com álcool', alts: ['cat:drinks', 'cat:vinhos', 'cat:cervejas', 'sec:alcoolico'] },
    { re: /\b(saudavel|saudaveis|fit|leve|healthy|light|nutritivo|detox|proteic[oa]|proteina|whey|colageno)\b/, label: 'Saudável', alts: ['sec:smoothie proteico', 'sec:detox', 'sec:bowl', 'sec:morning shot', 'sec:morning start', 'sec:salada', 'colageno', 'spirulina', 'chia'] },
    { re: /\b(compartilhar|dividir|petisco|petiscos|entrada|entradinha|porcao|beliscar)\b/, label: 'Para dividir', alts: ['sec:compartilhar', 'sec:entrada'] },
    { re: /\b(chas?|tea|infusao|infusoes)\b/, label: 'Chá', alts: ['sec:infusao', 'sec:cha gelado', 'matcha', 'chai', 'hojicha', 'hibisco', 'cha'] },
    { re: /\b(bebidas?|beber)\b/, label: 'Bebidas', alts: ['cat:cafe', 'cat:sucos', 'cat:drinks', 'cat:vinhos', 'cat:cervejas', 'cat:foam'] },
    { re: /\b(comida|comer|prato|pratos|refeicao|fome)\b/, label: 'Comida', alts: ['cat:brunch', 'cat:lunch', 'cat:dinner', 'cat:doces'] },
  ];

  // sinônimos de ingredientes / termos
  const SYN = {
    abacate: ['avocado', 'avo'], avocado: ['abacate', 'avo'], ovo: ['ovos', 'mexido', 'poche', 'pochê', 'beneditino'], ovos: ['ovo', 'mexido', 'poche'],
    salmao: ['salmon', 'salmão'], camarao: ['camaroes', 'shrimp'], frango: ['chicken', 'galinha'], queijo: ['queijos', 'cheese', 'burrata', 'mussarela', 'muçarela', 'parmigiano', 'boursin', 'cheddar', 'coalhada'],
    pao: ['toast', 'brioche', 'sanduba', 'sanduiche', 'fermentacao'], sanduiche: ['sanduba', 'toast'], lanche: ['sanduba', 'toast', 'sec:sanduba'], torrada: ['toast'],
    cogumelo: ['cogumelos', 'mushroom', 'shitake', 'shimeji'], carne: ['maminha', 'pernil', 'bacon', 'parma', 'presunto', 'burger', 'carpaccio'],
    suco: ['sucos', 'juice', 'sec:suco simples', 'sec:detox'], vinho: ['cat:vinhos', 'wine'], tinto: ['sec:vinho tinto'], branco: ['sec:vinho branco'], rose: ['sec:vinho rose'], laranja: ['laranja'],
    cerveja: ['cat:cervejas', 'beer', 'lager', 'ipa', 'chopp'], chopp: ['cat:cervejas'], espumante: ['sec:espumante', 'prosecco', 'brut', 'champagne', 'mimosa'],
    morango: ['strawberry', 'morangos'], chocolate: ['cacau', 'brigadeiro', 'mocha'], panqueca: ['pancake', 'sec:pancake'], pancake: ['panqueca'],
    cafe: ['cat:cafe', 'coffee', 'espresso', 'cafezinho', 'latte', 'cold brew', 'filtrado'], coffee: ['cat:cafe'], cafezinho: ['espresso'], expresso: ['espresso'],
    leite: ['latte', 'leite'], matcha: ['matcha'], pizza: ['sec:pizza'], salada: ['sec:salada'], bowl: ['sec:bowl', 'acai', 'açaí'], acai: ['bowl', 'cupuacu'],
    smoothie: ['sec:smoothie', 'sec:smoothie proteico'], vitamina: ['smoothie'], agua: ['agua', 'water'], refri: ['sec:soft'], refrigerante: ['sec:soft'],
    picles: ['pickles'], pimenta: ['apimentado'], massa: ['noodles', 'mie'], macarrao: ['noodles', 'mie'], arroz: ['nasi', 'rice'], peixe: ['salmao', 'atum', 'tuna'], atum: ['tuna'],
    banana: ['banana'], coco: ['coco', 'cupuacu'], gin: ['gin'], vodka: ['vodka'], tequila: ['tequila'], cachaca: ['cachaca', 'caipirinha'], rum: ['rum'],
    capuccino: ['cappuccino'], cappucino: ['cappuccino'], capucino: ['cappuccino'], capuchino: ['cappuccino'], caputino: ['cappuccino'], capuccinos: ['cappuccino'],
    sem: [], ate: [],
  };

  const PRICE_RE = [
    { re: /\bentre\s*r?\$?\s*(\d+(?:[.,]\d+)?)\s*(?:e|a|-)\s*r?\$?\s*(\d+(?:[.,]\d+)?)\s*(?:reais|conto|pila)?/, kind: 'range' },
    { re: /\b(?:ate|abaixo de|menos de|max(?:imo)?|no maximo|por ate|nao passa de|custando ate)\s*(?:de\s*)?r?\$?\s*(\d+(?:[.,]\d+)?)\s*(?:reais|conto|pila)?/, kind: 'max' },
    { re: /(?:<=?)\s*r?\$?\s*(\d+(?:[.,]\d+)?)/, kind: 'max' },
    { re: /\b(?:acima de|mais de|a partir de|minimo|pelo menos)\s*r?\$?\s*(\d+(?:[.,]\d+)?)\s*(?:reais|conto|pila)?/, kind: 'min' },
    { re: /(?:>=?)\s*r?\$?\s*(\d+(?:[.,]\d+)?)/, kind: 'min' },
    { re: /r\$\s*(\d+(?:[.,]\d+)?)|\b(\d+(?:[.,]\d+)?)\s*(?:reais|conto|pila)\b/, kind: 'max' },
  ];

  // ---------- índice ----------
  let INDEX = [], VOCAB = [], CATS = [];

  function build(menu) {
    INDEX = []; const vocab = new Set(); CATS = menu.cats;
    menu.cats.forEach((cat) => {
      cat.secs.forEach((sec) => {
        sec.items.forEach((it) => {
          const f = {
            name: words(it.n), sec: words(sec.n), cat: words(cat.n + ' ' + cat.id), desc: words(it.d),
            tags: words((it.t || []).join(' ')), extra: words((it.x || []).map((g) => g.c.map((c) => c.l).join(' ')).join(' ') + ' ' + (it.s || []).map((s) => s.l).join(' ')),
          };
          const full = {
            name: norm(it.n), sec: norm(sec.n), cat: cat.id, desc: norm(it.d), all: norm([it.n, it.d, sec.n, cat.n, (it.t || []).join(' ')].join(' | ')),
          };
          f.name.concat(f.desc, f.sec).forEach((w) => { if (w.length >= 3 && !/^\d+$/.test(w)) vocab.add(w); });
          const addon = /opcoes de leite/.test(full.sec) || full.name === 'add ons';
          INDEX.push({ it, cat, sec, f, full, addon, key: norm(it.n) + '|' + it.p });
        });
      });
    });
    VOCAB = [...vocab];
  }

  // ---------- distância de edição (Damerau-Levenshtein limitada) ----------
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const la = a.length, lb = b.length; let prev2 = null, prev = new Array(lb + 1), cur;
    for (let j = 0; j <= lb; j++) prev[j] = j;
    for (let i = 1; i <= la; i++) {
      cur = new Array(lb + 1); cur[0] = i; let rowMin = cur[0];
      for (let j = 1; j <= lb; j++) {
        const c = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1);
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > max) return max + 1;
      prev2 = prev; prev = cur;
    }
    return prev[lb];
  }
  const fuzzyMax = (t) => (t.length >= 7 ? 2 : t.length >= 4 ? 1 : 0);

  // pontua uma palavra contra uma lista de palavras do campo
  function wordScore(term, list) {
    let best = 0;
    for (const w of list) {
      if (w === term) return 1;
      if (term.length >= 2 && w.startsWith(term)) best = Math.max(best, 0.82);
      else if (term.length >= 4 && w.includes(term)) best = Math.max(best, 0.6);
      else if (w.length >= 4 && term.length >= 5 && term.startsWith(w)) best = Math.max(best, 0.7); // plural/flexão
      else {
        const m = fuzzyMax(term);
        if (m && (term.length >= 6 || term[0] === w[0]) && dist(term, w, m) <= m) best = Math.max(best, 0.55);
      }
    }
    return best;
  }
  const W = { name: 6, sec: 3.5, cat: 2.5, tags: 3, desc: 1.6, extra: 1 };

  function altScore(alt, e) {
    if (alt.startsWith('cat:')) return e.cat.id === alt.slice(4) ? 3 : 0;
    if (alt.startsWith('sec:')) return e.full.sec === alt.slice(4) ? 3.5 : 0;
    if (alt.includes(' ')) { // frase
      if (e.full.name.includes(alt)) return 6;
      if (e.full.all.includes(alt)) return 2.5;
      return 0;
    }
    let s = 0;
    for (const k in W) { const v = wordScore(alt, e.f[k]); if (v) s = Math.max(s, v * W[k]); }
    return s;
  }

  // ---------- fala natural ----------
  // "um suco de laranja… um suco de morango, na verdade" → "suco de morango"
  // "quais opções de cappuccino você tem?" → "cappuccino"
  const CORR_TEST = /\b(?:na verdade|alias|ou melhor|quer dizer|melhor dizendo)\b/;
  const CORR_SPLIT = /\b(?:na verdade|alias|ou melhor|quer dizer|melhor dizendo)\b/g;
  function clean(raw) {
    let q = ' ' + norm(raw).replace(/[“”"'?!.,;:¿¡…]+/g, ' ').replace(/\s+/g, ' ') + ' ';
    if (CORR_TEST.test(q)) {
      const parts = q.split(CORR_SPLIT).map((x) => x.trim());
      const after = parts[parts.length - 1];
      if (after) q = ' ' + after + ' ';
      else {
        const before = parts.slice(0, -1).join(' ');
        const segs = before.split(/\b(?:um|uma|uns|umas)\b/).map((x) => x.trim()).filter(Boolean);
        q = ' ' + (segs.length > 1 ? segs[segs.length - 1] : before) + ' ';
      }
    }
    q = q.replace(/\b(?:para|pra)\s+(?:duas|dois|tres|quatro|2|3|4)(?:\s+pessoas)?\b|\bpara o casal\b|\ba dois\b/g, ' ');
    q = q.replace(/\b(?:quais|qual)\s+(?:sao\s+)?(?:as\s+)?opcoes\s+de\b|\b(?:voce|voces|vcs)\s+(?:tem|teria|tem ai)\b|\b(?:eu\s+)?(?:quero|queria|gostaria de)\b|\bme\s+(?:ve|da|traz)\b/g, ' ');
    return q.replace(/\s+/g, ' ');
  }

  // ---------- parser ----------
  function parse(raw) {
    let q = ' ' + clean(raw).trim() + ' ';
    const intent = { tags: [], price: null, sort: null, groups: [], neg: [] };

    // preço
    for (const p of PRICE_RE) {
      const m = q.match(p.re);
      if (m) {
        const n1 = parseFloat((m[1] || m[2] || '0').replace(',', '.'));
        if (p.kind === 'range') {
          const n2 = parseFloat(m[2].replace(',', '.'));
          intent.price = { min: Math.min(n1, n2) * 100, max: Math.max(n1, n2) * 100, label: `R$ ${fmtN(Math.min(n1, n2))}–${fmtN(Math.max(n1, n2))}` };
        } else if (p.kind === 'max') {
          intent.price = { min: 0, max: n1 * 100, label: `até R$ ${fmtN(n1)}` };
        } else {
          intent.price = { min: n1 * 100, max: Infinity, label: `a partir de R$ ${fmtN(n1)}` };
        }
        q = q.replace(m[0], ' ');
        break;
      }
    }
    if (/\bmais barat[oa]s?\b|\bmenor preco\b|\bbaratinh[oa]\b/.test(q)) { intent.sort = { dir: 'asc', label: 'Mais baratos primeiro' }; q = q.replace(/\bmais barat[oa]s?\b|\bmenor preco\b|\bbaratinh[oa]\b/g, ' '); }
    if (/\bbarat[oa]s?\b|\bem conta\b|\beconomic[oa]\b/.test(q)) {
      if (!intent.price) intent.price = { min: 0, max: 2500, label: 'até R$ 25' };
      if (!intent.sort) intent.sort = { dir: 'asc', label: 'Mais baratos primeiro' };
      q = q.replace(/\bbarat[oa]s?\b|\bem conta\b|\beconomic[oa]\b/g, ' ');
    }
    if (/\bmais car[oa]s?\b|\bpremium\b|\bespecial\b/.test(q)) { intent.sort = { dir: 'desc', label: 'Mais especiais primeiro' }; q = q.replace(/\bmais car[oa]s?\b|\bpremium\b|\bespecial\b/g, ' '); }

    // dieta
    for (const d of DIET) {
      const m = q.match(d.re);
      if (m) { intent.tags.push({ alts: d.tag, label: d.label }); q = q.replace(d.re, ' '); }
    }
    // conceitos
    for (const c of CONCEPTS) {
      const m = q.match(c.re);
      if (m) {
        intent.groups.push({ label: c.label, alts: c.alts, concept: true });
        q = q.replace(c.re, ' ');
        if (c.kill) q = q.replace(c.kill, ' ');
      }
    }
    // negação genérica: "sem bacon"
    q = q.replace(/\bsem\s+([a-z]{3,})\b/g, (_, w) => { intent.neg.push({ w, label: 'sem ' + w }); return ' '; });

    // termos restantes
    const terms = q.split(/\s+/).filter((t) => t && !STOP.has(t) && !/^\d+$/.test(t) && t.length > 1);
    // frase completa (ex.: "cold brew", "pao de queijo")
    const rest = terms.join(' ');
    terms.forEach((t) => {
      const alts = [t].concat(SYN[t] ? SYN[t].map(norm) : []);
      intent.groups.push({ label: t, alts, term: t });
    });
    intent.phrase = rest.includes(' ') ? norm(raw).trim() : '';
    return intent;
  }
  const fmtN = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ','));

  // ---------- pedidos de harmonização ----------
  // "sugestão de drink para acompanhar o prato vegano", "bebida para comer com ovo e bacon"
  const PAIR_ASK = /\b(?:sugest\w*|sugir\w*|sugere|indic\w*|recomend\w*|combin\w*|harmoniz\w*|vai bem|acompanh\w*)\b/;
  const PAIR_DRINK = /\b(?:drinks?|bebidas?|vinhos?|sucos?|cafes?|cervejas?|beber|tomar)\b/;
  const PAIR_DISH = /\b(?:para acompanhar|pra acompanhar|acompanhar|para comer com|pra comer com|comer com|tomar com|combina com|combinar com|vai bem com|harmoniza com|harmonizar com|junto com)\s+(.+)$/;
  let lastDish = null; // o prato da conversa ("o prato vegano" que acabou de aparecer)
  function pairSearch(raw, opts) {
    const P = window.Pairings; if (!P) return null;
    const q = norm(raw).replace(/[“”"'?!.,;:]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!PAIR_ASK.test(q) || !PAIR_DRINK.test(q)) return null;
    const m = q.match(PAIR_DISH); if (!m) return null;
    const dishQ = (' ' + m[1] + ' ').replace(/\s(?:o|a|os|as|um|uma|meu|minha|esse|essa|este|esta|isso)(?=\s)/g, ' ').trim();
    if (!dishQ) return null;
    const label = (d) => 'Combina com ' + d.item.n;
    const food = (x) => !P.isDrink({ it: x.item, cat: x.cat, sec: x.sec });
    const found = search(dishQ + ' comida', Object.assign({}, opts, { noPair: true, keepDish: true })).results.filter(food);
    let dish = lastDish && found.find((x) => x.item === lastDish.item) ? lastDish : found[0];
    if (!dish || (opts.disabled && opts.disabled.has(label(dish)))) return null;
    const sug = P.suggest({ it: dish.item, cat: dish.cat, sec: dish.sec }, 4);
    if (!sug) return null;
    let items = sug.items;
    if (/\bdrinks?\b|\bcoquete/.test(q)) { const alc = items.filter((r) => /^(drinks|vinhos|cervejas)$/.test(r.cat.id)); if (alc.length) items = alc; }
    const results = items.map((r) => ({ item: r.it, cat: r.cat, sec: r.sec, score: 1, hl: new Set(), also: [] }));
    return { intent: { chips: [{ k: 'pair', label: label(dish) }], tags: [], groups: [], neg: [] }, results, relaxed: false, suggestion: null, pair: dish };
  }

  // ---------- busca ----------
  function search(raw, opts = {}) {
    if (!opts.noPair) { const pr = pairSearch(raw, opts); if (pr) return pr; }
    const intent = parse(raw);
    const dis = opts.disabled || new Set();
    intent.tags = intent.tags.filter((t) => !dis.has(t.label));
    intent.groups = intent.groups.filter((g) => !(g.concept && dis.has(g.label)));
    intent.neg = intent.neg.filter((n) => !dis.has(n.label));
    if (intent.price && dis.has(intent.price.label)) intent.price = null;
    if (intent.sort && dis.has(intent.sort.label)) intent.sort = null;
    intent.chips = [].concat(
      intent.tags.map((t) => ({ k: 'tag', label: t.label })),
      intent.price ? [{ k: 'price', label: intent.price.label }] : [],
      intent.groups.filter((g) => g.concept).map((g) => ({ k: 'concept', label: g.label })),
      intent.neg.map((n) => ({ k: 'neg', label: n.label })),
      intent.sort ? [{ k: 'sort', label: intent.sort.label }] : []
    );
    const hasAny = intent.groups.length || intent.tags.length || intent.price || intent.neg.length;
    if (!hasAny) return { intent, results: [], relaxed: false, suggestion: null };

    const scored = [];
    let relaxedScored = [];
    for (const e of INDEX) {
      const it = e.it;
      // filtros rígidos
      if (intent.tags.length && !intent.tags.every((tg) => (it.t || []).some((t) => tg.alts.includes(t)))) continue;
      if (intent.price) { if (!it.p || it.p < intent.price.min || it.p > intent.price.max) continue; }
      if (intent.neg.length && intent.neg.some((n) => e.full.all.includes(n.w))) continue;
      if (e.addon && !intent.groups.some((g) => g.term)) continue;

      let total = 0, matched = 0; const hl = new Set();
      for (const g of intent.groups) {
        let best = 0;
        for (const a of g.alts) {
          const s = altScore(a, e) * (g.concept && !a.includes(':') ? 0.6 : 1);
          if (s > best) best = s;
          if (s && !a.includes(':')) e.f.name.forEach((w) => { if (w === a || w.startsWith(a) || (a.length >= 4 && w.includes(a)) || (fuzzyMax(a) && dist(a, w, fuzzyMax(a)) <= fuzzyMax(a))) hl.add(w); });
        }
        if (best > 0) { matched++; total += best; }
      }
      if (intent.phrase && e.full.name.includes(intent.phrase)) total += 10;
      const groupsN = intent.groups.length;
      const rec = { e, score: total + (it.i ? 0.2 : 0), hl };
      if (!groupsN || matched === groupsN) scored.push(rec);
      else if (matched >= Math.max(1, Math.ceil(groupsN / 2))) { rec.score -= 3; relaxedScored.push(rec); }
    }
    let relaxed = false, list = scored;
    if (!scored.length && relaxedScored.length) { list = relaxedScored; relaxed = true; }

    // ordenação
    const dir = intent.sort && intent.sort.dir;
    if (dir === 'asc') list.sort((a, b) => (a.e.it.p || 1e9) - (b.e.it.p || 1e9) || b.score - a.score);
    else if (dir === 'desc') list.sort((a, b) => (b.e.it.p || 0) - (a.e.it.p || 0) || b.score - a.score);
    else if (!intent.groups.length) list.sort((a, b) => (a.e.it.p || 1e9) - (b.e.it.p || 1e9));
    else list.sort((a, b) => b.score - a.score);

    // remove duplicados (mesmo item em Lunch e Dinner)
    const seen = new Map(); const out = [];
    for (const r of list) {
      const k = r.e.key;
      if (seen.has(k)) { seen.get(k).also.push(r.e.cat.n); continue; }
      const o = { item: r.e.it, cat: r.e.cat, sec: r.e.sec, score: r.score, hl: r.hl, also: [] };
      seen.set(k, o); out.push(o);
    }

    // lembra o prato que apareceu primeiro (para "sugestão de drink para o prato vegano")
    if (!opts.keepDish && out.length && window.Pairings && !window.Pairings.isDrink({ it: out[0].item, cat: out[0].cat, sec: out[0].sec })) lastDish = out[0];

    // "você quis dizer"
    let suggestion = null;
    if (!out.length) suggestion = didYouMean(raw, intent);
    return { intent, results: out, relaxed, suggestion };
  }

  function didYouMean(raw, intent) {
    const terms = intent.groups.filter((g) => g.term).map((g) => g.term);
    if (!terms.length) return null;
    let changed = false;
    let q = norm(raw);
    for (const t of terms) {
      let best = null, bd = 99;
      for (const v of VOCAB) {
        const d = dist(t, v, 3);
        if (d < bd || (d === bd && best && v.length < best.length)) { bd = d; best = v; }
      }
      if (best && bd <= Math.max(2, Math.floor(t.length / 3)) && best !== t) { q = q.replace(t, best); changed = true; }
    }
    return changed ? q : null;
  }

  window.SmartSearch = { build, search, parse, norm };
})();
