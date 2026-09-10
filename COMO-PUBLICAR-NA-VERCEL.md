# Como publicar o site na Vercel (grátis)

O site é 100% estático: apenas o `index.html` e a pasta `img/`. Não precisa de build nem de configuração.

## Opção 1 — Arrastar e soltar (mais fácil, sem instalar nada)

1. Acesse [vercel.com](https://vercel.com) e crie uma conta grátis (pode entrar com Google ou GitHub).
2. No painel, clique em **Add New… → Project**.
3. Na parte de baixo da tela há a área **"Deploy without Git"** (ou acesse direto [vercel.com/new](https://vercel.com/new)).
4. Arraste a pasta inteira do projeto (`acquafisiofortunata iniciandopelocursor`) para a área de upload.
   - Importante: a pasta deve conter o `index.html` na raiz e a pasta `img/` junto.
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

O vídeo do botão de play está definido no `index.html`, na linha com `const YT_ID = 'FgHfq2PvKqM'`. Troque apenas o código entre aspas pelo ID do seu vídeo do YouTube (o trecho depois de `watch?v=` na URL).

## Trocar a foto da fachada

A foto `img/fachada.jpg` foi recortada de um print (qualidade reduzida). Quando tiver a foto original da fachada, recepção e rampa, basta substituir/adicionar os arquivos na pasta `img/` e ajustar os nomes na lista `AMB` dentro do `index.html`.
