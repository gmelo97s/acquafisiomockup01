/* =========================================================
   Sugestões "combina com"
   Bebida aberta → 3 comidas. Comida aberta → 3 bebidas.
   Regras escritas à mão, pensando no que se pede junto
   num brunch/bar: clássicos primeiro, depois alternativas.
   ========================================================= */
(function () {
  'use strict';
  const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[º°]/g, 'o').toLowerCase().trim();

  // Itens que não fazem sentido sugerir nem receber sugestão
  const SKIP = ['graos', 'vegetal', 'zero lactose', 'add ons', 'agua com gas', 'agua sem gas'];

  // Por item (nome normalizado) — tem prioridade
  const ITEM = {
    // café
    'espresso simples': ['Pão de Queijo', 'Torta Ganache 57% Cacau Carol Scarpa', 'Cookie'],
    'espresso duplo': ['Pão de Queijo', 'Brownie', 'Cookie'],
    'nepali': ['Pão de Queijo', 'Banana Bread', 'Chia Pudding'],
    'cappuccino': ['Avo Ovo', 'Pão de Queijo', 'Banana Bread'],
    'latte': ['Avocado', 'Banana Bread', 'Pão de Queijo'],
    'flat white': ['Avo Ovo', 'Queijo Quente', 'Pão de Queijo'],
    'chai latte (quente ou gelado)': ['Banana Bread', 'Red Fruit', 'Cookie'],
    'matcha latte (quente ou gelado)': ['Red Fruit', 'Avocado', 'Banana Bread'],
    'cacau': ['Cookie', 'Brownie', 'Pão de Queijo'],
    'mocha naveia': ['Brownie', 'Cookie', 'Banana Bread'],
    'golden milk': ['Chia Pudding', 'Banana Bread', 'Pão de Queijo'],
    'espresso tonica': ['Avocado', 'Salmão Sour', 'Pão de Queijo'],
    'espresso martini': ['Brownie', 'Torta Ganache 57% Cacau Carol Scarpa', 'Torta Cookie Brigadeiro Lua'],
    'carajillo': ['Brownie', 'Torta de Banana e Doce de Leite', 'Torta Ganache 57% Cacau Carol Scarpa'],
    // foam
    'hojicha foam': ['Banana Bread', 'Cookie', 'Red Fruit'],
    // sucos
    'laranja': ['Avo Ovo', 'Clássico', 'Ovas e Salmão'],
    'suco de tomate': ['Ovas e Salmão', 'Avo Bacon Vibes', 'Clássico'],
    'coco verde in natura': ['Tostadas de Salmão', 'Avocado', 'Ahí Poke'],
    'hibisco lemonade': ['Tostadas de Salmão', 'Caesar', 'Avocado'],
    'cha de hibisco': ['Avocado', 'Pão de Queijo', 'Cookie'],
    'cha-mate capim santo': ['Queijo Quente', 'Pão de Queijo', 'Avocado'],
    // drinks
    'caipirinha': ['Tostadas de Pernil', 'Crostini', 'Tostadas de Salmão'],
    'mimosa': ['Ovas e Salmão', 'Avocado e Camarão', 'Salmão Sour'],
    'mojito': ['Tostadas de Salmão', 'Nasi Goreng', 'Crostini'],
    'aperol spritz': ['Burrata', 'Crostini com Queijo Tulha', 'Margherita'],
    'gin tonica': ['Tostadas de Salmão', 'Ahí Poke', 'Crostini'],
    'bloody mary': ['Avo Bacon Vibes', 'Ovas e Salmão', 'Minêro'],
    'clericot jarra': ['Burrata', 'Margherita', 'Crostini'],
    'cosmopolitan': ['Tostadas de Salmão', 'Carpaccio', 'Crostini'],
    'boulevardier': ['Carpaccio', 'Crostini com Queijo Tulha', 'Braised Beef'],
    'negroni': ['Carpaccio', 'Crostini com Queijo Tulha', 'Diavola'],
    'dry martini': ['Steak Tartar', 'Carpaccio', 'Crostini'],
    'manhattan': ['Braised Beef', 'Carpaccio', 'Crostini com Queijo Tulha'],
    'fitzgerald': ['Tostadas de Salmão', 'Burrata', 'Crostini com Queijo Tulha'],
    'penicillin': ['Shogayaki', 'Braised Beef', 'Crostini com Queijo Tulha'],
    'margarita': ['Tostadas de Pernil', 'Tostadas de Salmão', 'Crostini'],
    'macunaima': ['Tostadas de Pernil', 'Diavola', 'Crostini'],
    'clover club': ['Burrata', 'Crostini com Queijo Tulha', 'Torta Ganache 57% Cacau Carol Scarpa'],
    'whisky sour': ['Braised Beef', 'Tostadas de Pernil', 'Crostini com Queijo Tulha'],
    'green haze': ['Tostadas de Salmão', 'Ahí Poke', 'Vegan Tartar'],
    'brasil com s': ['Tostadas de Pernil', 'Nasi Goreng', 'Crostini'],
    'xingu': ['Tostadas de Pernil', 'Chicken Curry', 'Crostini'],
    'negroni coffee': ['Brownie', 'Carpaccio', 'Crostini com Queijo Tulha'],
    'breeze': ['Avocado', 'Tostadas de Salmão', 'Buda Bowl'],
    // vinhos
    'vitrea andes chardonnay': ['Pesto e Salmão', 'Peixe no Vapor', 'Burrata'],
    'mannara pinot grigio': ['Caesar', 'Peixe no Vapor', 'Crostini'],
    'mikron torrontes': ['Chicken Curry', 'Tostadas de Salmão', 'Ahí Poke'],
    'marchiori & barraud copete chardonnay': ['Peixe no Vapor', 'Pesto e Salmão', 'Burrata'],
    'lo abarca no2 sauvignon blanc': ['Tuna Crispy Rice', 'Pesto e Salmão', 'Vegan Tartar'],
    'vitrea andes cabernet sauvignon': ['Braised Beef', 'Carbonara', 'Steak Tartar'],
    'felipe marin costal no1 pinot noir': ['Cogumelos Trufados', 'Shogayaki', 'Burrata'],
    'altos las hormigas malbec clasico': ['Braised Beef', 'Steak Tartar', 'Diavola'],
    'polvanera la marchesana primitivo': ['Diavola', 'Parma', 'Carbonara'],
    'exopto cosecha rioja': ['Braised Beef', 'Carpaccio', 'Parma'],
    'grand bateau rouge': ['Braised Beef', 'Steak Tartar', 'Brie e Alho Negro'],
    'castello della paneretta chianti classico': ['Margherita', 'Pomodoro', 'Parma'],
    // cervejas
    'eisenbahn ipa': ['Chicken Curry', 'Nasi Goreng', 'Tostadas de Pernil'],
    'blue moon': ['Tostadas de Salmão', 'Peixe no Vapor', 'Margherita'],
    'amstel ultra (sem gluten)': ['Tostadas de Pernil', 'Tostadas de Salmão', 'Ahí Poke'],
    'heineken ultimate (sem gluten)': ['Tostadas de Pernil', 'Tostadas de Salmão', 'Ahí Poke'],

    // comidas → bebidas
    'parma & ricota': ['Flat White', 'Aperol Spritz', 'Laranja'],
    'salmao sour': ['Mimosa', 'Espresso Tônica', 'Vita C'],
    'avo bacon vibes': ['Bloody Mary', 'Flat White', 'Laranja'],
    'sour cream dream': ['Mimosa', 'Flat White', 'Vita C'],
    'red fruit': ['Latte', 'Matcha Latte (quente ou gelado)', 'Chai Latte (quente ou gelado)'],
    'american': ['Botanikafé Orgânico', 'Cappuccino', 'Laranja'],
    'minero': ['Pingado Botanika', 'Laranja', 'Bloody Mary'],
    'pernil': ['Praya Lager', 'Hibisco Lemonade', 'Laranja'],
    'tuna melt': ['Hibisco Lemonade', 'Iced Latte', 'Praya Lager'],
    'biquini sandwich': ['Aperol Spritz', 'Hibisco Lemonade', 'Flat White'],
    'pao de queijo': ['Espresso Simples', 'Cappuccino', 'Pingado Botanika'],
    'banana bread': ['Latte', 'Chai Latte (quente ou gelado)', 'Cold Brew'],
    'cookie': ['Iced Latte', 'Cappuccino', 'Cacau'],
    'tostadas de salmao': ['Margarita', 'Green Haze', 'Hibisco Lemonade'],
    'tostadas de pernil': ['Margarita', 'Eisenbahn Ipa', 'Caipirinha'],
    'vegan tartar': ['Aperol Spritz', 'Lo Abarca Nº2 Sauvignon Blanc', 'Breeze'],
    'steak tartar': ['Dry Martini', 'Altos Las Hormigas Malbec Clásico', 'Negroni'],
    'burrata': ['Aperol Spritz', 'Maison Mirabeau Belle Année', 'Fitzgerald'],
    'caesar': ['Mannara Pinot Grigio', 'Hibisco Lemonade', 'Verde 2'],
    'pesto e salmao': ['Vitrea Andes Chardonnay', 'Gin Tônica', 'Capim Santo'],
    'tuna crispy rice': ['Lo Abarca Nº2 Sauvignon Blanc', 'Green Haze', 'Hibisco Lemonade'],
    'nasi goreng': ['Eisenbahn Ipa', 'Krontiras Cosmic Amber', 'Hibisco Lemonade'],
    'mie goreng': ['Eisenbahn Ipa', 'Krontiras Cosmic Amber', 'Hibisco Lemonade'],
    'shogayaki': ['Felipe Marín Costal Nº1 Pinot Noir', 'Penicillin', 'Chá-Mate Capim Santo'],
    'braised beef': ['Altos Las Hormigas Malbec Clásico', 'Vitrea Andes Cabernet Sauvignon', 'Boulevardier'],
    'peixe no vapor': ['Mikron Torrontés', 'Vitrea Andes Chardonnay', 'Capim Santo'],
    'chicken curry': ['Mikron Torrontés', 'Eisenbahn Ipa', 'Hibisco Lemonade'],
    'buda bowl': ['Verde 2', 'Krontiras Cosmic Amber', 'Breeze'],
    'ahi poke': ['Gin Tônica', 'Lo Abarca Nº2 Sauvignon Blanc', 'Chá de Hibisco'],
    'carpaccio': ['Negroni', 'Vitrea Andes Cabernet Sauvignon', 'Dry Martini'],
    'crostini': ['Aperol Spritz', 'Praya Lager', 'Vitrea Andes Chardonnay'],
    'crostini com queijo tulha': ['Vitrea Andes Cabernet Sauvignon', 'Aperol Spritz', 'Negroni'],
    'panini de carpaccio': ['Altos Las Hormigas Malbec Clásico', 'Heineken', 'Negroni'],
    'margherita': ['Castello della Paneretta Chianti Classico', 'Aperol Spritz', 'Heineken'],
    'pomodoro': ['Castello della Paneretta Chianti Classico', 'Aperol Spritz', 'Praya Lager'],
    'parma': ['Polvanera La Marchesana Primitivo', 'Aperol Spritz', 'Blue Moon'],
    'carbonara': ['Polvanera La Marchesana Primitivo', 'Eisenbahn Ipa', 'Negroni'],
    'boursin e rucula': ['Maison Mirabeau Belle Année', 'Aperol Spritz', 'Blue Moon'],
    'brie e alho negro': ['Grand Bateau Rouge', 'Negroni', 'Eisenbahn Ipa'],
    'cogumelos trufados': ['Felipe Marín Costal Nº1 Pinot Noir', 'Exopto Cosecha Rioja', 'Negroni'],
    'diavola': ['Eisenbahn Ipa', 'Polvanera La Marchesana Primitivo', 'Margarita'],
    'vegana': ['Krontiras Cosmic Amber', 'Aperol Spritz', 'Breeze'],
    'banana nevada': ['Espresso Simples', 'Carajillo', 'Espresso Martini'],
    'torta de banana e doce de leite': ['Espresso Simples', 'Carajillo', 'Cappuccino'],
    'torta cookie brigadeiro lua': ['Espresso Simples', 'Cold Brew', 'Infusão Omi Òna'],
    'torta ganache 57% cacau carol scarpa': ['Espresso Martini', 'Espresso Duplo', 'Negroni Coffee'],
    'brownie': ['Espresso Martini', 'Carajillo', 'Cold Brew'],
    'chia pudding': ['Cappuccino', 'Golden Milk', 'Laranja'],
    'matcha chia pudding': ['Matcha Latte (quente ou gelado)', 'Cold Brew', 'Coco Verde in Natura'],
    'frutas': ['Cappuccino', 'Chá de Hibisco', 'Laranja'],
  };

  // Por seção (categoria/seção normalizadas) — quando o item não tem regra própria
  const SEC = {
    'foam/foam season': ['Red Fruit', 'Avocado', 'Banana Bread'],
    'cafe/espresso': ['Pão de Queijo', 'Cookie', 'Banana Bread'],
    'cafe/lab': ['Banana Bread', 'Cookie', 'Avocado'],
    'cafe/filtrado': ['Pão de Queijo', 'Banana Bread', 'Clássico'],
    'cafe/infusao': ['Banana Bread', 'Chia Pudding', 'Cookie'],
    'cafe/gelado': ['Avocado', 'Banana Bread', 'Cookie'],
    'sucos/suco simples': ['Avocado', 'Queijo Quente', 'Pão de Queijo'],
    'sucos/smoothie': ['Avocado', 'Chia Pudding', 'Pão de Queijo'],
    'sucos/smoothie proteico': ['Avo Ovo', 'Clássico', 'Buda Bowl'],
    'sucos/morning shot': ['Avocado', 'Chia Pudding', 'Frutas'],
    'sucos/cha gelado': ['Avocado', 'Queijo Quente', 'Tostadas de Salmão'],
    'sucos/detox': ['Avocado', 'Buda Bowl', 'Pesto e Salmão'],
    'sucos/soft': ['Queijo Quente', 'Pão de Queijo', 'Cookie'],
    'drinks/classico': ['Crostini', 'Tostadas de Salmão', 'Burrata'],
    'drinks/da casa': ['Tostadas de Pernil', 'Crostini', 'Tostadas de Salmão'],
    'drinks/mocktail': ['Avocado', 'Tostadas de Salmão', 'Buda Bowl'],
    'vinhos/espumante': ['Tostadas de Salmão', 'Ovas e Salmão', 'Burrata'],
    'vinhos/vinho branco': ['Peixe no Vapor', 'Pesto e Salmão', 'Burrata'],
    'vinhos/vinho laranja': ['Nasi Goreng', 'Buda Bowl', 'Crostini com Queijo Tulha'],
    'vinhos/vinho rose': ['Burrata', 'Tostadas de Salmão', 'Margherita'],
    'vinhos/vinho tinto': ['Braised Beef', 'Parma', 'Crostini com Queijo Tulha'],
    'cervejas/cerveja': ['Tostadas de Pernil', 'Diavola', 'Crostini'],
    // comida → bebida
    'brunch/toast': ['Cappuccino', 'Laranja', 'Matcha Latte (quente ou gelado)'],
    'brunch/mexido': ['Cappuccino', 'Laranja', 'Botanikafé Orgânico'],
    'brunch/pancake': ['Latte', 'Botanikafé Orgânico', 'Laranja'],
    'brunch/beneditino': ['Mimosa', 'Laranja', 'Cappuccino'],
    'brunch/sanduba': ['Cappuccino', 'Chá-Mate Capim Santo', 'Hibisco Lemonade'],
    'brunch/simples': ['Cappuccino', 'Espresso Simples', 'Latte'],
    'sucos/bowl': ['Cold Brew', 'Coco Verde in Natura', 'Capim Santo'],
    'sucos/morning start': ['Cappuccino', 'Matcha Latte (quente ou gelado)', 'Laranja'],
    'lunch/compartilhar': ['Aperol Spritz', 'Margarita', 'Hibisco Lemonade'],
    'lunch/salada': ['Hibisco Lemonade', 'Vitrea Andes Chardonnay', 'Verde 2'],
    'lunch/principal': ['Hibisco Lemonade', 'Eisenbahn Ipa', 'Vitrea Andes Chardonnay'],
    'dinner/entrada': ['Aperol Spritz', 'Negroni', 'Vitrea Andes Cabernet Sauvignon'],
    'dinner/pizza': ['Castello della Paneretta Chianti Classico', 'Aperol Spritz', 'Heineken'],
    'dinner/compartilhar': ['Aperol Spritz', 'Margarita', 'Hibisco Lemonade'],
    'dinner/salada': ['Vitrea Andes Chardonnay', 'Hibisco Lemonade', 'Verde 2'],
    'dinner/principal': ['Altos Las Hormigas Malbec Clásico', 'Eisenbahn Ipa', 'Hibisco Lemonade'],
    'doces/sobremesa': ['Espresso Simples', 'Cappuccino', 'Espresso Martini'],
  };

  const DRINK_CATS = new Set(['foam', 'cafe', 'drinks', 'vinhos', 'cervejas']);
  const FOOD_SECS_IN_SUCOS = new Set(['bowl', 'morning start']);
  function isDrink(rec) {
    if (rec.cat.id === 'sucos') return !FOOD_SECS_IN_SUCOS.has(norm(rec.sec.n));
    return DRINK_CATS.has(rec.cat.id);
  }

  let BY_NAME = null;
  function index(menu) {
    BY_NAME = new Map();
    menu.cats.forEach((cat) => cat.secs.forEach((sec) => sec.items.forEach((it) => {
      const k = norm(it.n);
      if (!BY_NAME.has(k)) BY_NAME.set(k, { it, cat, sec }); // 1ª ocorrência (Lunch antes de Dinner)
    })));
  }

  function suggest(rec, n = 3) {
    if (!BY_NAME) index(window.MENU);
    const key = norm(rec.it.n);
    if (SKIP.includes(key)) return null;
    const list = ITEM[key] || SEC[rec.cat.id + '/' + norm(rec.sec.n)] || null;
    if (!list) return null;
    const out = [], seen = new Set([key]);
    for (const name of list) {
      const k = norm(name); if (seen.has(k)) continue;
      const r = BY_NAME.get(k); if (!r) continue;
      seen.add(k); out.push(r);
      if (out.length >= n) break;
    }
    if (!out.length) return null;
    return { title: isDrink(rec) ? 'Para acompanhar' : 'Para beber junto', items: out };
  }

  window.Pairings = { suggest, isDrink, index };
})();
