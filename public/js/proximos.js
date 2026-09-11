function upcomingRow(m) {
  return `
    <div class="match-row" onclick="location.href='/equipo.html?id=${m.home.id}'">
      <div class="match-teams">
        <div class="match-team"><img src="${m.home.logo}" onerror="teamLogoFallback(event)" alt="" /> ${m.home.name}</div>
        <div class="match-score">vs</div>
        <div class="match-team"><img src="${m.away.logo}" onerror="teamLogoFallback(event)" alt="" /> ${m.away.name}</div>
      </div>
      <div class="match-meta">${formatDate(m.date)}<br/>${m.venue}${m.city ? ', ' + m.city : ''}${m.round ? '<br/>' + m.round : ''}</div>
    </div>`;
}

async function loadUpcoming() {
  const container = document.getElementById('upcoming-container');
  try {
    const result = await fetchJSON('/api/upcoming');
    const matches = result.data;
    container.innerHTML = matches.length
      ? matches.map(upcomingRow).join('')
      : '<div class="loading">No hay proximos partidos programados por ahora.</div>';
    if (result.warning) showBanner(document.querySelector('.container'), result.warning, 'warning');
  } catch (err) {
    container.innerHTML = '';
    showBanner(document.querySelector('.container'), err.message, 'error');
  }
}

window.onDataRefresh = loadUpcoming;
loadUpcoming();
