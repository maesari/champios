const axios = require('axios');
const {
  COMPETITION_CODE,
  RATE_LIMIT_MAX_CALLS,
  RATE_LIMIT_WINDOW_MS,
} = require('../config');

const client = axios.create({
  baseURL: 'https://api.football-data.org/v4',
  timeout: 10000,
  headers: {
    'X-Auth-Token': process.env.FOOTBALL_DATA_TOKEN || '',
  },
});

function apiError(kind, message) {
  const err = new Error(message);
  err.kind = kind;
  err.message = message;
  return err;
}

function classifyError(err) {
  if (!process.env.FOOTBALL_DATA_TOKEN) {
    return apiError(
      'no_key',
      'No se configuro un token de football-data.org en el servidor (FOOTBALL_DATA_TOKEN).'
    );
  }
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.code === 'EAI_AGAIN') {
    return apiError(
      'no_internet',
      'No hay conexion a internet en el servidor, no se pudo contactar el servicio de datos.'
    );
  }
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return apiError(
      'timeout',
      'El servicio de datos tardo demasiado en responder (posible problema de conexion).'
    );
  }
  const status = err.response?.status;
  if (status === 401 || status === 403) {
    return apiError(
      'invalid_key',
      'El token de football-data.org no es valido, expiro, o el plan gratuito no incluye este recurso.'
    );
  }
  if (status === 429) {
    return apiError(
      'rate_limited',
      'Se alcanzo el limite de solicitudes por minuto del plan gratuito de football-data.org.'
    );
  }
  return apiError('unknown', 'Error inesperado obteniendo datos del torneo. Intenta mas tarde.');
}

// --- Limitador simple de 8 llamadas/minuto para no chocar con el limite del plan free ---
const callTimestamps = [];
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function waitForSlot() {
  while (true) {
    const now = Date.now();
    while (callTimestamps.length && now - callTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
      callTimestamps.shift();
    }
    if (callTimestamps.length < RATE_LIMIT_MAX_CALLS) {
      callTimestamps.push(now);
      return;
    }
    const waitMs = RATE_LIMIT_WINDOW_MS - (now - callTimestamps[0]) + 50;
    await sleep(waitMs);
  }
}

async function apiGet(path, params) {
  await waitForSlot();
  try {
    const res = await client.get(path, { params });
    return res.data;
  } catch (err) {
    throw classifyError(err);
  }
}

function mapMatch(m) {
  return {
    id: m.id,
    date: m.utcDate,
    status: m.status,
    round: m.matchday ? `Jornada ${m.matchday}` : '',
    venue: m.venue || 'Por confirmar',
    city: '',
    home: {
      id: m.homeTeam.id,
      name: m.homeTeam.name,
      logo: m.homeTeam.crest,
      winner: m.score?.winner === 'HOME_TEAM' ? true : m.score?.winner === 'AWAY_TEAM' ? false : null,
    },
    away: {
      id: m.awayTeam.id,
      name: m.awayTeam.name,
      logo: m.awayTeam.crest,
      winner: m.score?.winner === 'AWAY_TEAM' ? true : m.score?.winner === 'HOME_TEAM' ? false : null,
    },
    goalsHome: m.score?.fullTime?.home ?? null,
    goalsAway: m.score?.fullTime?.away ?? null,
  };
}

async function getMatchDetail(matchId) {
  const m = await apiGet(`/matches/${matchId}`);
  return {
    ...mapMatch(m),
    halfTimeHome: m.score?.halfTime?.home ?? null,
    halfTimeAway: m.score?.halfTime?.away ?? null,
    referee: m.referees?.[0]?.name || null,
    stage: m.stage || null,
  };
}

async function getStandings() {
  const data = await apiGet(`/competitions/${COMPETITION_CODE}/standings`);
  const table = data.standings?.[0]?.table || [];
  const rows = table.map((row) => ({
    rank: row.position,
    teamId: row.team.id,
    teamName: row.team.name,
    logo: row.team.crest,
    played: row.playedGames,
    win: row.won,
    draw: row.draw,
    lose: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalsDiff: row.goalDifference,
    points: row.points,
    form: row.form,
  }));
  return { season: data.season?.startDate?.slice(0, 4) || null, rows };
}

async function getResults(limit = 15) {
  const data = await apiGet(`/competitions/${COMPETITION_CODE}/matches`, { status: 'FINISHED' });
  const matches = (data.matches || []).map(mapMatch).sort((a, b) => new Date(b.date) - new Date(a.date));
  return matches.slice(0, limit);
}

async function getUpcoming(limit = 15) {
  const data = await apiGet(`/competitions/${COMPETITION_CODE}/matches`, { status: 'SCHEDULED' });
  const matches = (data.matches || []).map(mapMatch).sort((a, b) => new Date(a.date) - new Date(b.date));
  return matches.slice(0, limit);
}

async function getTeams() {
  const data = await apiGet(`/competitions/${COMPETITION_CODE}/teams`);
  return (data.teams || []).map((t) => ({
    id: t.id,
    name: t.name,
    logo: t.crest,
    country: t.area?.name || '',
    founded: t.founded || null,
    venue: t.venue || null,
    city: '',
  }));
}

async function getSquad(teamId) {
  const data = await apiGet(`/teams/${teamId}`);
  return (data.squad || []).map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position || null,
    nationality: p.nationality || null,
    dateOfBirth: p.dateOfBirth || null,
  }));
}

async function getTeamFixtures(teamId, limit = 5) {
  const data = await apiGet(`/teams/${teamId}/matches`, {
    competitions: COMPETITION_CODE,
    status: 'SCHEDULED',
    limit,
  });
  const matches = (data.matches || []).map(mapMatch).sort((a, b) => new Date(a.date) - new Date(b.date));
  return matches.slice(0, limit);
}

async function getTeamResults(teamId, limit = 20) {
  const data = await apiGet(`/teams/${teamId}/matches`, {
    competitions: COMPETITION_CODE,
    status: 'FINISHED',
    limit,
  });
  const matches = (data.matches || []).map(mapMatch).sort((a, b) => new Date(b.date) - new Date(a.date));
  // Se agrega el resultado (G/E/P) y los goles a favor/en contra desde la
  // perspectiva de este equipo, para poder desglosar las estadisticas del
  // equipo sin necesitar goleadores (que la fuente gratuita no entrega).
  return matches.map((m) => {
    const isHome = String(m.home.id) === String(teamId);
    const goalsFor = isHome ? m.goalsHome : m.goalsAway;
    const goalsAgainst = isHome ? m.goalsAway : m.goalsHome;
    let outcome = 'draw';
    if (goalsFor > goalsAgainst) outcome = 'win';
    else if (goalsFor < goalsAgainst) outcome = 'loss';
    return { ...m, outcome, goalsFor, goalsAgainst };
  });
}

module.exports = {
  getStandings,
  getResults,
  getUpcoming,
  getTeams,
  getSquad,
  getTeamFixtures,
  getTeamResults,
  getMatchDetail,
};
