let teamsCache = [];

function renderStandings(rows) {
  const container = document.getElementById('standings-container');
  if (!rows.length) {
    container.innerHTML = '<div class="loading">Aun no hay datos de la tabla para esta temporada.</div>';
    return;
  }
  const body = rows
    .map(
      (r) => `
      <tr onclick="location.href='/equipo.html?id=${r.teamId}'">
        <td class="rank">${r.rank}</td>
        <td class="team-cell"><img src="${r.logo}" onerror="teamLogoFallback(event)" alt="" /> ${r.teamName}</td>
        <td>${r.played}</td>
        <td>${r.win}</td>
        <td>${r.draw}</td>
        <td>${r.lose}</td>
        <td>${r.goalsFor}:${r.goalsAgainst}</td>
        <td>${r.goalsDiff}</td>
        <td><strong>${r.points}</strong></td>
      </tr>`
    )
    .join('');
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF:GC</th><th>DG</th><th>Pts</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
}

function matchRow(m) {
  const played = m.status === 'FT';
  return `
    <div class="match-row" onclick="location.href='/equipo.html?id=${m.home.id}'">
      <div class="match-teams">
        <div class="match-team"><img src="${m.home.logo}" onerror="teamLogoFallback(event)" alt="" /> ${m.home.name}</div>
        <div class="match-score">${played ? `${m.goalsHome} - ${m.goalsAway}` : 'vs'}</div>
        <div class="match-team"><img src="${m.away.logo}" onerror="teamLogoFallback(event)" alt="" /> ${m.away.name}</div>
      </div>
      <div class="match-meta">${formatDate(m.date)}<br/>${m.venue}${m.city ? ', ' + m.city : ''}</div>
    </div>`;
}

function renderResults(matches) {
  const container = document.getElementById('results-container');
  if (!matches.length) {
    container.innerHTML = '<div class="loading">No hay resultados recientes todavia.</div>';
    return;
  }
  container.innerHTML = matches.slice(0, 10).map(matchRow).join('');
}

async function loadHome() {
  const container = document.querySelector('.container');
  try {
    const [standings, results, teams] = await Promise.all([
      fetchJSON('/api/standings'),
      fetchJSON('/api/results'),
      fetchJSON('/api/teams'),
    ]);
    renderStandings(standings.data.rows);
    renderResults(results.data);
    teamsCache = teams.data;
    [standings, results, teams].forEach((r) => {
      if (r.warning) showBanner(container, r.warning, 'warning');
    });
  } catch (err) {
    document.getElementById('standings-container').innerHTML = '';
    document.getElementById('results-container').innerHTML = '';
    showBanner(container, err.message, 'error');
  }
}

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function handleSearch() {
  const input = document.getElementById('search-input');
  const resultDiv = document.getElementById('search-result');
  const query = normalize(input.value);
  resultDiv.innerHTML = '';
  if (!query) return;

  if (!teamsCache.length) {
    resultDiv.innerHTML = '<div class="banner info">Los equipos aun se estan cargando, intenta de nuevo en un momento.</div>';
    return;
  }

  const match = teamsCache.find(
    (t) => normalize(t.name).includes(query) || query.includes(normalize(t.name))
  );

  if (match) {
    resultDiv.innerHTML = `
      <div class="banner info">
        Encontre <strong>${match.name}</strong>. Ve a su pagina para ver su historia en el torneo, estadisticas y jugadores.
        <div style="margin-top:8px;"><button class="nav-btn" style="background:var(--accent);border-color:var(--accent);" onclick="location.href='/equipo.html?id=${match.id}'">Ver ${match.name}</button></div>
      </div>`;
  } else {
    resultDiv.innerHTML =
      '<div class="banner warning">No encontre ese equipo entre los que estan actualmente en el torneo. Intenta escribir el nombre completo o parcial del club (ej. "Real Madrid", "Bayern").</div>';
  }
}

document.getElementById('search-btn').addEventListener('click', handleSearch);
document.getElementById('search-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

window.onDataRefresh = loadHome;
loadHome();
