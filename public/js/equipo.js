let teamResultsCache = [];
let teamPlayersCache = [];

function getTeamId() {
  const params = new URLSearchParams(location.search);
  return params.get('id');
}

function renderHeader(team, standing) {
  const header = document.getElementById('team-header');
  header.innerHTML = `
    <div class="card team-header">
      <img src="${team.logo}" onerror="teamLogoFallback(event)" alt="${team.name}" />
      <div>
        <h1>${team.name}</h1>
        <div class="meta">
          ${team.country || ''}${team.founded ? ' &middot; Fundado en ' + team.founded : ''}
          ${team.venue ? ' &middot; Estadio: ' + team.venue : ''}
        </div>
        ${
          standing
            ? `<div class="meta">Posicion actual: <strong>#${standing.rank}</strong> con <strong>${standing.points} puntos</strong> (${standing.win}G ${standing.draw}E ${standing.lose}P)</div>`
            : '<div class="meta">Aun no tiene posicion registrada en la tabla de esta temporada.</div>'
        }
      </div>
    </div>
    <p class="search-hint">Nota: el historial completo de participaciones pasadas de este club en la Champions League no esta disponible en la fuente de datos gratuita usada por esta app; aqui se muestra la informacion disponible de la temporada actual.</p>
  `;
}

function renderStats(stats) {
  const container = document.getElementById('team-stats');
  if (!stats) {
    container.innerHTML = '<div class="banner info">No hay estadisticas de la temporada actual disponibles para este equipo todavia.</div>';
    return;
  }
  container.innerHTML = `
    <div class="stat-grid">
      <button class="stat-box" data-filter="played"><div class="value">${stats.played}</div><div class="label">Jugados</div></button>
      <button class="stat-box" data-filter="win"><div class="value">${stats.wins}</div><div class="label">Ganados</div></button>
      <button class="stat-box" data-filter="draw"><div class="value">${stats.draws}</div><div class="label">Empatados</div></button>
      <button class="stat-box" data-filter="loss"><div class="value">${stats.loses}</div><div class="label">Perdidos</div></button>
      <button class="stat-box" data-filter="goalsFor"><div class="value">${stats.goalsFor}</div><div class="label">Goles a favor</div></button>
      <button class="stat-box" data-filter="goalsAgainst"><div class="value">${stats.goalsAgainst}</div><div class="label">Goles en contra</div></button>
    </div>
    ${stats.form ? `<p class="search-hint">Forma reciente: ${stats.form}</p>` : ''}
    <div id="stat-detail" class="stat-detail"></div>
  `;

  container.querySelectorAll('.stat-box').forEach((btn) => {
    btn.addEventListener('click', () => {
      const alreadyActive = btn.classList.contains('active');
      container.querySelectorAll('.stat-box').forEach((b) => b.classList.remove('active'));
      const detail = document.getElementById('stat-detail');
      if (alreadyActive) {
        detail.innerHTML = '';
        return;
      }
      btn.classList.add('active');
      renderStatDetail(btn.dataset.filter);
    });
  });
}

function statMatchRow(m, filter) {
  const teamId = getTeamId();
  const isHome = String(m.home.id) === String(teamId);
  const opponent = isHome ? m.away : m.home;
  let extra = '';
  if (filter === 'goalsFor') extra = `<div class="match-meta">Goles de este equipo en el partido: <strong>${m.goalsFor}</strong></div>`;
  if (filter === 'goalsAgainst') extra = `<div class="match-meta">Goles recibidos en el partido: <strong>${m.goalsAgainst}</strong></div>`;
  return `
    <div class="match-row">
      <div class="match-teams">
        <div class="match-team"><img src="${m.home.logo}" onerror="teamLogoFallback(event)" alt="" /> ${m.home.name}</div>
        <div class="match-score">${m.goalsHome} - ${m.goalsAway}</div>
        <div class="match-team"><img src="${m.away.logo}" onerror="teamLogoFallback(event)" alt="" /> ${m.away.name}</div>
      </div>
      <div class="match-meta">${formatDate(m.date)}<br/>vs ${opponent.name}</div>
      ${extra}
    </div>`;
}

function renderStatDetail(filter) {
  const detail = document.getElementById('stat-detail');
  let matches = teamResultsCache;
  let title = 'Todos los partidos jugados';
  if (filter === 'win') {
    matches = teamResultsCache.filter((m) => m.outcome === 'win');
    title = 'Partidos ganados';
  } else if (filter === 'draw') {
    matches = teamResultsCache.filter((m) => m.outcome === 'draw');
    title = 'Partidos empatados';
  } else if (filter === 'loss') {
    matches = teamResultsCache.filter((m) => m.outcome === 'loss');
    title = 'Partidos perdidos';
  } else if (filter === 'goalsFor') {
    matches = teamResultsCache.filter((m) => m.goalsFor > 0);
    title = 'Partidos en los que anoto goles (el desglose por jugador no esta disponible en el plan gratuito de datos)';
  } else if (filter === 'goalsAgainst') {
    matches = teamResultsCache.filter((m) => m.goalsAgainst > 0);
    title = 'Partidos en los que recibio goles (el desglose por jugador no esta disponible en el plan gratuito de datos)';
  }

  if (!matches.length) {
    detail.innerHTML = `<div class="stat-detail-title">${title}</div><div class="loading">No hay partidos en esta categoria todavia.</div>`;
    return;
  }
  detail.innerHTML = `
    <div class="stat-detail-title">${title}</div>
    <div class="match-list">${matches.map((m) => statMatchRow(m, filter)).join('')}</div>
  `;
}

function renderUpcoming(matches) {
  const container = document.getElementById('team-upcoming');
  if (!matches.length) {
    container.innerHTML = '<div class="loading">No hay proximos partidos programados para este equipo por ahora.</div>';
    return;
  }
  container.innerHTML = matches
    .map(
      (m) => `
      <div class="match-row">
        <div class="match-teams">
          <div class="match-team"><img src="${m.home.logo}" onerror="teamLogoFallback(event)" alt="" /> ${m.home.name}</div>
          <div class="match-score">vs</div>
          <div class="match-team"><img src="${m.away.logo}" onerror="teamLogoFallback(event)" alt="" /> ${m.away.name}</div>
        </div>
        <div class="match-meta">${formatDate(m.date)}<br/>Estadio: ${m.venue}${m.city ? ', ' + m.city : ''}</div>
      </div>`
    )
    .join('');
}

function calcAge(dateOfBirth) {
  if (!dateOfBirth) return '-';
  const dob = new Date(dateOfBirth);
  const diff = Date.now() - dob.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function openPlayerModal(player) {
  const modalRoot = document.getElementById('player-modal');
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal-card">
        <button class="modal-close" id="modal-close" aria-label="Cerrar">&times;</button>
        <h2>${player.name}</h2>
        <div class="meta" style="color:var(--text-dim);margin-bottom:10px;">${player.position || 'Posicion no especificada'}</div>
        <div class="modal-row"><span class="label">Nacionalidad</span><span>${player.nationality || '-'}</span></div>
        <div class="modal-row"><span class="label">Fecha de nacimiento</span><span>${player.dateOfBirth || '-'}</span></div>
        <div class="modal-row"><span class="label">Edad</span><span>${calcAge(player.dateOfBirth)}</span></div>
        <p class="search-hint" style="margin-top:14px;">Las estadisticas de la temporada actual de este jugador (goles, asistencias, tarjetas) no estan disponibles en el plan gratuito de la fuente de datos usada por esta app.</p>
      </div>
    </div>`;
  document.getElementById('modal-close').addEventListener('click', closePlayerModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closePlayerModal();
  });
}

function closePlayerModal() {
  document.getElementById('player-modal').innerHTML = '';
}

async function loadPlayers(teamId) {
  const container = document.getElementById('team-players');
  container.innerHTML = '<div class="loading">Cargando plantilla...</div>';
  try {
    const result = await fetchJSON(`/api/teams/${teamId}/players`);
    const players = result.data;
    teamPlayersCache = players;
    if (!players.length) {
      container.innerHTML = '<div class="loading">No hay informacion de la plantilla disponible todavia para este equipo.</div>';
      return;
    }
    const rows = players
      .map(
        (p, idx) => `
        <tr class="player-row" data-idx="${idx}">
          <td class="team-cell">${p.name}</td>
          <td>${p.position || '-'}</td>
          <td>${p.nationality || '-'}</td>
          <td>${calcAge(p.dateOfBirth)}</td>
        </tr>`
      )
      .join('');
    container.innerHTML = `
      ${
        result.statsAvailable === false
          ? '<div class="banner info">El plan gratuito de datos usado por esta app no incluye estadisticas de jugadores de la temporada actual (goles, asistencias, tarjetas). Aqui se muestra la plantilla del equipo con su informacion basica.</div>'
          : ''
      }
      <table>
        <thead>
          <tr><th>Jugador</th><th>Posicion</th><th>Nacionalidad</th><th>Edad</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
    container.querySelectorAll('.player-row').forEach((row) => {
      row.addEventListener('click', () => openPlayerModal(teamPlayersCache[Number(row.dataset.idx)]));
    });
    if (result.warning) showBanner(document.querySelector('.container'), result.warning, 'warning');
  } catch (err) {
    container.innerHTML = '';
    showBanner(document.querySelector('.container'), err.message, 'error');
  }
}

async function loadTeam() {
  const teamId = getTeamId();
  if (!teamId) {
    document.getElementById('team-header').innerHTML =
      '<div class="banner error">No se especifico un equipo. Vuelve a la seccion de Equipos y elige uno.</div>';
    return;
  }
  try {
    const result = await fetchJSON(`/api/teams/${teamId}`);
    const { team, standing, statistics, upcoming, results } = result.data;
    teamResultsCache = results || [];
    renderHeader(team, standing);
    renderStats(statistics);
    renderUpcoming(upcoming);
    if (result.warning) showBanner(document.querySelector('.container'), result.warning, 'warning');
    await loadPlayers(teamId);
  } catch (err) {
    document.getElementById('team-header').innerHTML = '';
    showBanner(document.querySelector('.container'), err.message, 'error');
  }
}

window.onDataRefresh = loadTeam;
loadTeam();
