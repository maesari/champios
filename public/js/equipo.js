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
      <div class="stat-box"><div class="value">${stats.played}</div><div class="label">Jugados</div></div>
      <div class="stat-box"><div class="value">${stats.wins}</div><div class="label">Ganados</div></div>
      <div class="stat-box"><div class="value">${stats.draws}</div><div class="label">Empatados</div></div>
      <div class="stat-box"><div class="value">${stats.loses}</div><div class="label">Perdidos</div></div>
      <div class="stat-box"><div class="value">${stats.goalsFor}</div><div class="label">Goles a favor</div></div>
      <div class="stat-box"><div class="value">${stats.goalsAgainst}</div><div class="label">Goles en contra</div></div>
    </div>
    ${stats.form ? `<p class="search-hint">Forma reciente: ${stats.form}</p>` : ''}
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
        <div class="match-meta">${formatDate(m.date)}<br/>${m.venue}${m.city ? ', ' + m.city : ''}</div>
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

async function loadPlayers(teamId) {
  const container = document.getElementById('team-players');
  container.innerHTML = '<div class="loading">Cargando plantilla...</div>';
  try {
    const result = await fetchJSON(`/api/teams/${teamId}/players`);
    const players = result.data;
    if (!players.length) {
      container.innerHTML = '<div class="loading">No hay informacion de la plantilla disponible todavia para este equipo.</div>';
      return;
    }
    const rows = players
      .map(
        (p) => `
        <tr>
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
    const { team, standing, statistics, upcoming } = result.data;
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
