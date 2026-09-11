const express = require('express');
const cache = require('../services/cache');
const footballData = require('../services/footballData');
const { REFRESH_COOLDOWN_MS } = require('../config');

const router = express.Router();

let lastManualRefresh = 0;

function sendResult(res, result, extra = {}) {
  res.json({
    ok: true,
    data: result.data,
    stale: result.stale,
    fetchedAt: result.fetchedAt,
    warning: result.stale ? result.error?.message : null,
    ...extra,
  });
}

function sendError(res, err) {
  const status =
    err.kind === 'no_internet' || err.kind === 'timeout'
      ? 503
      : err.kind === 'invalid_key' || err.kind === 'no_key'
      ? 500
      : err.kind === 'rate_limited'
      ? 429
      : 502;
  res.status(status).json({ ok: false, error: err.kind || 'unknown', message: err.message });
}

function route(key, fetchFn) {
  return async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      const result = await cache.getOrFetch(key, fetchFn, { forceRefresh });
      sendResult(res, result);
    } catch (err) {
      sendError(res, err);
    }
  };
}

router.get('/standings', route('standings', () => footballData.getStandings()));
router.get('/results', route('results', () => footballData.getResults()));
router.get('/upcoming', route('upcoming', () => footballData.getUpcoming()));
router.get('/teams', route('teams', () => footballData.getTeams()));

router.get('/teams/:id', async (req, res) => {
  const teamId = req.params.id;
  try {
    const [teams, standings, fixtures] = await Promise.all([
      cache.getOrFetch('teams', () => footballData.getTeams()),
      cache.getOrFetch('standings', () => footballData.getStandings()),
      cache.getOrFetch(`team-fixtures:${teamId}`, () => footballData.getTeamFixtures(teamId)),
    ]);
    const team = teams.data.find((t) => String(t.id) === String(teamId));
    if (!team) {
      return res.status(404).json({ ok: false, error: 'not_found', message: 'Equipo no encontrado en el torneo actual.' });
    }
    const standingRow = standings.data.rows.find((r) => String(r.teamId) === String(teamId)) || null;
    // Las estadisticas del equipo se derivan de su fila en la tabla de posiciones
    // (el plan gratuito de football-data.org no tiene un endpoint aparte de estadisticas).
    const statistics = standingRow
      ? {
          played: standingRow.played,
          wins: standingRow.win,
          draws: standingRow.draw,
          loses: standingRow.lose,
          goalsFor: standingRow.goalsFor,
          goalsAgainst: standingRow.goalsAgainst,
          form: standingRow.form,
        }
      : null;
    const stale = teams.stale || standings.stale || fixtures.stale;
    const warning = [teams, standings, fixtures].find((r) => r.stale)?.error?.message || null;
    res.json({
      ok: true,
      data: { team, standing: standingRow, statistics, upcoming: fixtures.data },
      stale,
      warning,
    });
  } catch (err) {
    sendError(res, err);
  }
});

router.get('/teams/:id/players', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === '1';
    const result = await cache.getOrFetch(
      `squad:${req.params.id}`,
      () => footballData.getSquad(req.params.id),
      { forceRefresh }
    );
    // El plan gratuito de football-data.org solo da la plantilla (sin goles/asistencias/tarjetas
    // de la temporada actual); se avisa al frontend para que no muestre columnas vacias.
    sendResult(res, result, { statsAvailable: false });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/refresh', async (req, res) => {
  const now = Date.now();
  if (now - lastManualRefresh < REFRESH_COOLDOWN_MS) {
    const waitSec = Math.ceil((REFRESH_COOLDOWN_MS - (now - lastManualRefresh)) / 1000);
    return res.status(429).json({
      ok: false,
      error: 'cooldown',
      message: `Ya se actualizo hace poco, intenta de nuevo en ${waitSec} segundos.`,
    });
  }
  lastManualRefresh = now;
  try {
    const [standings, results, upcoming] = await Promise.all([
      cache.getOrFetch('standings', () => footballData.getStandings(), { forceRefresh: true }),
      cache.getOrFetch('results', () => footballData.getResults(), { forceRefresh: true }),
      cache.getOrFetch('upcoming', () => footballData.getUpcoming(), { forceRefresh: true }),
    ]);
    const stale = standings.stale || results.stale || upcoming.stale;
    const warning = [standings, results, upcoming].find((r) => r.stale)?.error?.message || null;
    res.json({ ok: true, stale, warning });
  } catch (err) {
    sendError(res, err);
  }
});

router.post('/exit', (req, res) => {
  res.json({ ok: true, message: 'Apagando el servidor...' });
  setTimeout(() => process.exit(0), 300);
});

module.exports = router;
