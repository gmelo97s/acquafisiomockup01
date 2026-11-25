# Como publicar o site na Vercel (grátis)

O site é 100% estático: apenas o `index.html` e as pastas `img/` e `video/` (vídeo institucional do hero). Não precisa de build nem de configuração.

## Opção 1 — Arrastar e soltar (mais fácil, sem instalar nada)

1. Acesse [vercel.com](https://vercel.com) e crie uma conta grátis (pode entrar com Google ou GitHub).
2. No painel, clique em **Add New… → Project**.
3. Na parte de baixo da tela há a área **"Deploy without Git"** (ou acesse direto [vercel.com/new](https://vercel.com/new)).
4. Arraste a pasta inteira do projeto (`acquafisiofortunata iniciandopelocursor`) para a área de upload.
   - Importante: a pasta deve conter o `index.html` na raiz e as pastas `img/` e `video/` junto.
5. Clique em **Deploy**. Em cerca de 30 segundos o site estará no ar em um endereço tipo `https://acquafisio.vercel.app`.

## Opção 2 — Pela linha de comando (Vercel CLI)

Abra o PowerShell na pasta do projeto e rode:

```powershell
npm install -g vercel
vercel login
vercel --prod
```

Aceite as respostas padrão (Enter em tudo). Ao final ele mostra a URL pública.

## Domínio próprio (opcional)

No painel da Vercel: **Settings → Domains → Add** e siga as instruções para apontar o domínio (ex.: `acquafisiofortunata.com.br`) — também é grátis na Vercel; você paga apenas o registro do domínio (ex.: registro.br).

## Para atualizar o site depois

- **Opção 1:** repita o arraste-e-solte (cria um novo deploy).
- **Opção 2:** rode `vercel --prod` de novo na pasta.

## Trocar o vídeo do player

O vídeo do botão de play fica na pasta `video/` e é definido no `index.html`, nas linhas `const VIDEO_SRC` e `const VIDEO_POSTER`. Para trocar, coloque o novo MP4 na pasta `video/` **com um nome novo** (ex.: `acqua-fisio-fortunata-v4.mp4`), aponte as duas linhas para ele e apague o arquivo antigo. O nome novo garante que ninguém continue vendo a versão anterior guardada no navegador.

## Popup de promoção

O popup (hoje, a Black Friday da hidroginástica) fica no `index.html`, no bloco `<!-- POPUP DE PROMOÇÃO -->`, e as regras ficam no script, em `const PROMO`:

- `fim`: data em que o popup some sozinho do site.
- `segundos`: quanto tempo depois de abrir o site ele aparece.
- `dobra`: a seção que dispara o popup quando a pessoa chega nela.
- `id`: troque sempre que trocar a promoção, para o popup voltar a aparecer para todo mundo.

Para uma promoção nova, troque a arte (`img/`), o texto do WhatsApp nos dois links `data-promo-cta`, a frase de validade e o `PROMO`. Para testar de novo depois de já ter visto o popup, abra o site em uma aba anônima.

## Próximos eventos

Os eventos ficam no bloco `<!-- PRÓXIMOS EVENTOS -->`. Cada evento é um `<article class="ev">`: copie um inteiro, troque a arte, o título, as informações, o texto do WhatsApp e as datas `data-inicio` (começo do evento) e `data-fim` (quando o card deve sumir). Funciona com arte quadrada, 4:5 ou capa de reels (9:16). Eventos passados somem sozinhos e, sem eventos futuros, a seção inteira some.

## Trocar a foto da fachada

A foto `img/fachada.jpg` foi recortada de um print (qualidade reduzida). Quando tiver a foto original da fachada, recepção e rampa, basta substituir/adicionar os arquivos na pasta `img/` e ajustar os nomes na lista `AMB` dentro do `index.html`.
