const COMPETITION_CODE = 'CL'; // UEFA Champions League en football-data.org

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const REFRESH_COOLDOWN_MS = 60 * 1000; // 1 minuto entre refrescos manuales

// football-data.org (plan Free) permite 10 solicitudes por minuto.
// Dejamos margen de seguridad para no recibir 429 por rafagas.
const RATE_LIMIT_MAX_CALLS = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Render define la variable de entorno RENDER=true automaticamente en todos
// sus servicios; asi distinguimos "corriendo en el hosting compartido" de
// "corriendo en la computadora de una persona". El boton Salir y el apagado
// automatico por inactividad solo tienen sentido en el segundo caso: en el
// hosting compartido apagarian el servicio para todas las personas conectadas.
const IS_SHARED_DEPLOYMENT = Boolean(process.env.RENDER);

const HEARTBEAT_STARTUP_GRACE_MS = 60 * 1000; // tiempo para abrir la app antes de apagar por nadie conectado
const HEARTBEAT_IDLE_GRACE_MS = 25 * 1000; // tiempo sin heartbeats (pestanas cerradas) antes de apagar

module.exports = {
  COMPETITION_CODE,
  CACHE_TTL_MS,
  REFRESH_COOLDOWN_MS,
  RATE_LIMIT_MAX_CALLS,
  RATE_LIMIT_WINDOW_MS,
  IS_SHARED_DEPLOYMENT,
  HEARTBEAT_STARTUP_GRACE_MS,
  HEARTBEAT_IDLE_GRACE_MS,
};
