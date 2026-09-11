const COMPETITION_CODE = 'CL'; // UEFA Champions League en football-data.org

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const REFRESH_COOLDOWN_MS = 60 * 1000; // 1 minuto entre refrescos manuales

// football-data.org (plan Free) permite 10 solicitudes por minuto.
// Dejamos margen de seguridad para no recibir 429 por rafagas.
const RATE_LIMIT_MAX_CALLS = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

module.exports = {
  COMPETITION_CODE,
  CACHE_TTL_MS,
  REFRESH_COOLDOWN_MS,
  RATE_LIMIT_MAX_CALLS,
  RATE_LIMIT_WINDOW_MS,
};
