const { CACHE_TTL_MS } = require('../config');

// key -> { data, fetchedAt }
const store = new Map();

/**
 * Devuelve datos frescos usando `fetchFn`, cacheados por `key`.
 * Si el fetch falla y hay un dato anterior en cache, regresa ese dato
 * marcado como `stale` en vez de tronar, para no dejar la pantalla en blanco.
 */
async function getOrFetch(key, fetchFn, { forceRefresh = false } = {}) {
  const cached = store.get(key);
  const isFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (isFresh && !forceRefresh) {
    return { data: cached.data, stale: false, fetchedAt: cached.fetchedAt, fromCache: true };
  }

  try {
    const data = await fetchFn();
    store.set(key, { data, fetchedAt: Date.now() });
    return { data, stale: false, fetchedAt: Date.now(), fromCache: false };
  } catch (err) {
    if (cached) {
      return {
        data: cached.data,
        stale: true,
        fetchedAt: cached.fetchedAt,
        fromCache: true,
        error: err.kind ? err : { kind: 'unknown', message: err.message },
      };
    }
    throw err;
  }
}

function lastRefreshedAt(key) {
  const cached = store.get(key);
  return cached ? cached.fetchedAt : null;
}

module.exports = { getOrFetch, lastRefreshedAt };
