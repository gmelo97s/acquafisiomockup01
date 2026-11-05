/* =========================================================
   Últimos reels do @botanikafe para a galeria do site.
   Usa a API oficial do Instagram (Instagram API com login do Instagram).
   Só funciona depois que o próprio Botanikafé autoriza: o token da conta
   fica na Vercel em Settings → Environment Variables → IG_TOKEN.
   Sem token (ou se o Instagram falhar), responde lista vazia e o site
   continua mostrando as fotos da galeria.
   ========================================================= */
const FIELDS = 'id,media_type,media_product_type,media_url,thumbnail_url,permalink,caption,timestamp';

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const token = process.env.IG_TOKEN;
  if (!token) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    return res.status(200).send(JSON.stringify({ configured: false, reels: [] }));
  }
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(`https://graph.instagram.com/me/media?fields=${FIELDS}&limit=30&access_token=${encodeURIComponent(token)}`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) throw new Error('instagram ' + r.status);
    const j = await r.json();
    const reels = (j.data || [])
      .filter((m) => m.media_type === 'VIDEO' && m.media_url && (!m.media_product_type || m.media_product_type === 'REELS'))
      .slice(0, 6)
      .map((m) => ({
        id: m.id,
        video: m.media_url,
        poster: m.thumbnail_url || '',
        url: m.permalink,
        caption: String(m.caption || '').split('\n')[0].slice(0, 90),
        date: m.timestamp,
      }));
    // a CDN guarda por 15 min: reel novo aparece sozinho, sem consultar o Instagram a cada visita
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
    return res.status(200).send(JSON.stringify({ configured: true, reels }));
  } catch (e) {
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.status(200).send(JSON.stringify({ configured: true, reels: [], error: true }));
  }
};
