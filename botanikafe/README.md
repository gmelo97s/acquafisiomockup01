# Botanikafé · Cardápio (projeto conceito)

Cardápio digital estático (HTML/CSS/JS, sem build), mobile first, com cara de app.

No ar: https://botanikafe.vercel.app

## O que tem

- **Abertura com a chave**: ao rolar (ou tocar em "Abrir o cardápio"), o logo 3D vai ao centro, gira como uma chave, as portas se abrem e o logo pousa no topo.
- **Novidades**: carrossel com toque direto (sem precisar virar card), parallax nas fotos e inclinação 3D no desktop.
- **Cardápio completo**: 208 itens, abas por categoria, filtros (vegano, sem glúten etc.), fotos de garrafa sem corte.
- **"Combina com"**: ao abrir uma bebida, sugere 3 comidas; ao abrir uma comida, sugere 3 bebidas (`js/pairings.js`).
- **Busca em linguagem natural**: "vegano até R$ 40", "café gelado", "beneditino sem salmão", com correção de erros de digitação e busca por voz.
- **Galeria** em loop automático e arrastável.
- **Folhas animadas** nas transições (`js/leaves.js`), poucas e rápidas.
- **Modo dia/noite**, instalável como app (`manifest.webmanifest`).

## Arquivos

| Arquivo | Para quê |
|---|---|
| `index.html` | Estrutura da página |
| `css/styles.css` | Visual (cores da marca nas variáveis do `:root`) |
| `js/menu-data.js` | Cardápio (`window.MENU`), preços em centavos |
| `js/pairings.js` | Regras de "combina com" |
| `js/search.js` | Busca inteligente |
| `js/hero3d.js` | Logo 3D, folhas e grãos (Three.js) |
| `js/leaves.js` | Folhas 2D das transições |
| `js/app.js` | Interface, abertura com a chave, galeria, ficha do item |

## Usar como modelo para outro restaurante

1. Troque `js/menu-data.js` e as fotos em `img/m/` pelo cardápio do restaurante (mesmo formato).
2. Troque o símbolo do logo (`<symbol id="logo">` no `index.html`) e as cores no `:root` do CSS.
3. Ajuste as regras de `js/pairings.js` aos nomes dos novos itens.
4. Troque textos do topo, endereço e fotos da galeria.

## Publicar

Pela CLI da Vercel, dentro desta pasta:

```bash
npx vercel --prod
```

## Rodar localmente

```bash
python3 -m http.server 8080   # abra http://localhost:8080
```

É preciso um servidor local porque o 3D usa módulos ES (não abre via `file://`).
