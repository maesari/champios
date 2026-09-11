const axios = require('axios');

const client = axios.create({
  baseURL: 'https://es.wikipedia.org',
  timeout: 8000,
  headers: {
    // Wikimedia rechaza peticiones sin un User-Agent descriptivo (politica de la API).
    'User-Agent': 'ChampiosApp/1.0 (https://github.com/maesari/champios; contacto app UEFA Champions League)',
  },
});

// Foto del jugador: API oficial de resumen de Wikipedia (no requiere llave).
async function getSummary(name) {
  try {
    const res = await client.get(`/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
    if (res.data?.type === 'disambiguation') return null;
    return res.data;
  } catch (err) {
    return null;
  }
}

// Numero de camiseta: se busca en la ficha (infobox) del articulo, campo "numero".
// Puede no reflejar el equipo/temporada actual si el articulo esta desactualizado.
async function getShirtNumber(name) {
  try {
    const res = await client.get('/w/api.php', {
      params: {
        action: 'query',
        titles: name,
        prop: 'revisions',
        rvprop: 'content',
        rvsection: 0,
        format: 'json',
        formatversion: 2,
      },
    });
    const page = res.data?.query?.pages?.[0];
    if (!page || page.missing) return null;
    const content = page.revisions?.[0]?.content || '';
    const match = content.match(/\|\s*n[uú]mero\s*=\s*([^\n|]+)/i);
    return match ? match[1].trim() : null;
  } catch (err) {
    return null;
  }
}

async function getPlayerInfo(name) {
  const [summary, shirtNumber] = await Promise.all([getSummary(name), getShirtNumber(name)]);
  if (!summary && !shirtNumber) return null;
  return {
    photo: summary?.thumbnail?.source || null,
    description: summary?.description || null,
    shirtNumber: shirtNumber || null,
    wikiUrl: summary?.content_urls?.desktop?.page || null,
  };
}

module.exports = { getPlayerInfo };
