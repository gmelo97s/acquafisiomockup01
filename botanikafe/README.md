# Botanikafé · Café Bienal — site conceito

Site estático (HTML/CSS/JS, sem build). Mobile first, hero 3D (Three.js), animações GSAP/ScrollTrigger, busca inteligente no cardápio e tema dia/noite.

- Cardápio: 208 itens extraídos do LiveMenu oficial (`js/menu-data.js`)
- Fotos: botanikafe.com (unidade Café Bienal) e LiveMenu (`img/`)
- Logo: símbolo da foto de perfil do @botanikafe (vetor em `img/brand/symbol.svg`)

## Publicar na Vercel

**Pelo painel:** vercel.com/new → Import Git Repository → `acquafisiomockup01` → em *Root Directory* escolha `botanikafe` → Framework Preset: *Other* → Deploy.
O site está no branch `botanikafe-site`; para produção, faça o merge no `main` ou escolha esse branch em *Settings → Git → Production Branch*.

**Pela CLI:**

```bash
cd botanikafe
npx vercel --prod
```

## Rodar localmente

```bash
cd botanikafe
python3 -m http.server 8080   # abra http://localhost:8080
```

(É preciso um servidor local: o hero 3D usa módulos ES, que não abrem via `file://`.)

## Editar o cardápio

Os itens estão em `js/menu-data.js` (`window.MENU`). Preços em centavos (`p: 3800` = R$ 38). Tags aceitas: `Vegano`, `Vegetariano`, `Sem Gluten`, `Sem Lactose`, `Sem açúcar`, `Apimentado`, `Levemente Apimentado`.
