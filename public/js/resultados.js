function matchRow(m) {
  return `
    <div class="match-row" onclick="openMatchModal(${m.id})">
      <div class="match-teams">
        <div class="match-team"><img src="${m.home.logo}" onerror="teamLogoFallback(event)" alt="" /> ${m.home.name}</div>
        <div class="match-score">${m.goalsHome} - ${m.goalsAway}</div>
        <div class="match-team"><img src="${m.away.logo}" onerror="teamLogoFallback(event)" alt="" /> ${m.away.name}</div>
      </div>
      <div class="match-meta">${formatDate(m.date)}<br/>Estadio: ${m.venue}${m.city ? ', ' + m.city : ''}${m.round ? '<br/>' + m.round : ''}</div>
    </div>`;
}

async function loadResults() {
  const container = document.getElementById('results-container');
  try {
    const result = await fetchJSON('/api/results');
    const matches = result.data;
    container.innerHTML = matches.length
      ? matches.map(matchRow).join('')
      : '<div class="loading">No hay resultados recientes todavia.</div>';
    if (result.warning) showBanner(document.querySelector('.container'), result.warning, 'warning');
  } catch (err) {
    container.innerHTML = '';
    showBanner(document.querySelector('.container'), err.message, 'error');
  }
}

window.onDataRefresh = loadResults;
loadResults();
