async function loadTeams() {
  const container = document.getElementById('teams-container');
  try {
    const result = await fetchJSON('/api/teams');
    const teams = result.data;
    if (!teams.length) {
      container.innerHTML = '<div class="loading">No hay equipos disponibles.</div>';
      return;
    }
    container.innerHTML = teams
      .map(
        (t) => `
        <div class="team-card" onclick="location.href='/equipo.html?id=${t.id}'">
          <img src="${t.logo}" onerror="teamLogoFallback(event)" alt="${t.name}" />
          <div class="name">${t.name}</div>
          <div class="country">${t.country || ''}</div>
        </div>`
      )
      .join('');
    if (result.warning) showBanner(document.querySelector('.container'), result.warning, 'warning');
  } catch (err) {
    container.innerHTML = '';
    showBanner(document.querySelector('.container'), err.message, 'error');
  }
}

window.onDataRefresh = loadTeams;
loadTeams();
