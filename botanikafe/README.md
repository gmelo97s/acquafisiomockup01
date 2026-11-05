# Botanikafé · Cardápio (projeto conceito)

Cardápio digital estático (HTML/CSS/JS, sem build), mobile first, com cara de app.

No ar: https://botanikafe.vercel.app

## O que tem

- **Hero**: fundo verde-floresta da marca com uma luz dourada que "respira" atrás do logo 3D.
- **Abertura com a chave**: o botão "Clique para abrir o cardápio" é uma etiqueta de chaveiro pendurada no logo 3D, com uma dica animada apontando para baixo (some quando a pessoa interage e não volta depois que o cardápio já foi aberto na visita). Ao tocar nela (ou depois de ~2 rolagens, no celular e no desktop), a porta abre sozinha: o logo vira a chave, entra na fechadura de uma porta dupla de madeira com vidro jateado e latão, gira, as folhas abrem para dentro e a câmera atravessa até o cardápio. Voltando ~2 rolagens a partir do topo do cardápio, a porta fecha sozinha e volta ao início.
- **Menu inferior (celular)**: só aparece a partir das Novidades; nunca cobre o hero e a porta.
- **Novidades**: carrossel em loop automático (o mesmo da galeria), arrastável, com parallax nas fotos e inclinação 3D no desktop; tocar num card abre a ficha.
- **Cardápio completo**: 208 itens, abas por categoria, filtros (vegano, sem glúten etc.), fotos de garrafa sem corte.
- **Tags que pesquisam**: tocar em "Vegano", "Picante", "Sem lactose"… (na lista ou na ficha) abre a busca com todos os itens daquela tag.
- **"Combina com"**: todos os itens têm 3 sugestões. Bebida sugere comidas, comida sugere bebidas, e os casos especiais (café em grãos, leites, adicionais do bowl, água) têm sugestões próprias (`js/pairings.js`).
- **Ficha do item no celular**: a foto se ajusta para caber tudo na tela, inclusive as sugestões, sem precisar rolar.
- **Busca em linguagem natural**: "vegano até R$ 40", "café gelado", "beneditino sem salmão", com correção de erros de digitação e busca por voz.
- **Galeria** em loop automático e arrastável; tocar numa foto abre ampliada (setas, arrastar para os lados, arrastar para baixo ou voltar fecha).
- **Reels do Instagram na galeria** (opcional): com a conta do café conectada, a galeria troca as fotos pelos últimos 6 reels sozinha. Veja abaixo.
- **Folhas animadas** nas transições (`js/leaves.js`), poucas e rápidas.
- **Modo dia/noite**, instalável como app (`manifest.webmanifest`).

## Preços

Os preços vêm do cardápio oficial. Quatro itens chegam sem preço no campo de preço:

- **Banana Bread** e **Gin Tônica** têm o preço escrito na descrição. Aqui eles viraram opções com preço ("a partir de").
- **ADD ONS** (adicionais do bowl) mostra "a partir de" com o menor adicional.
- **Grãos** (café para levar) não tem preço no oficial ("consulte valores") e continua como "consulte".

## Reels do Instagram na galeria

A função `api/reels.js` (Vercel) busca os últimos reels pela API oficial do Instagram e a galeria passa a mostrá-los sozinha. Um reel novo aparece em até 15 minutos.

Sem autorização do próprio Botanikafé não há como fazer isso de forma oficial: o Instagram só entrega os reels de uma conta para quem tem o token dela. Até lá, a galeria mostra as fotos.

Para ativar, com a conta do café:

1. A conta @botanikafe precisa ser profissional (empresa ou criador de conteúdo).
2. Em developers.facebook.com, crie um app e adicione o produto **Instagram** (API com login do Instagram).
3. Na configuração da API, adicione a conta @botanikafe e gere o token de acesso.
4. Na Vercel, em Settings → Environment Variables, crie `IG_TOKEN` com esse token e publique de novo.

O token vale 60 dias. Se a galeria voltar a mostrar as fotos, gere um token novo e troque o `IG_TOKEN`.

## Arquivos

| Arquivo | Para quê |
|---|---|
| `index.html` | Estrutura da página |
| `css/styles.css` | Visual (cores da marca nas variáveis do `:root`) |
| `js/menu-data.js` | Cardápio (`window.MENU`), preços em centavos |
| `js/pairings.js` | Regras de "combina com" |
| `js/search.js` | Busca inteligente |
| `js/hero3d.js` | Logo 3D (a chave), folhas e grãos (Three.js) |
| `js/leaves.js` | Folhas 2D das transições |
| `js/app.js` | Interface, abertura com a chave e a porta, carrosséis (novidades e galeria), ficha do item |
| `api/reels.js` | Últimos reels do Instagram (precisa de `IG_TOKEN`) |
| `img/door/` | Textura do vidro jateado da porta |

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

É preciso um servidor local porque o 3D usa módulos ES (não abre via `file://`). A rota `api/reels` só existe na Vercel; localmente a galeria mostra as fotos.
