function renderNav(active) {
  const pages = [
    { href: '/index.html', label: 'Inicio', key: 'inicio' },
    { href: '/equipos.html', label: 'Equipos', key: 'equipos' },
    { href: '/resultados.html', label: 'Resultados', key: 'resultados' },
    { href: '/proximos.html', label: 'Proximos partidos', key: 'proximos' },
  ];

  const links = pages
    .map(
      (p) =>
        `<a class="nav-btn ${p.key === active ? 'active' : ''}" href="${p.href}">${p.label}</a>`
    )
    .join('');

  const nav = document.createElement('div');
  nav.className = 'navbar';
  nav.innerHTML = `
    <div class="navbar-inner">
      <div class="brand"><span class="ball">&#9917;</span> UEFA Champions League</div>
      <div class="nav-links">${links}</div>
      <div class="nav-actions">
        <button class="nav-btn btn-refresh" id="btn-refresh">Actualizar resultados</button>
        <button class="nav-btn btn-exit" id="btn-exit">Salir</button>
      </div>
    </div>
  `;
  document.body.prepend(nav);

  document.getElementById('btn-refresh').addEventListener('click', async (ev) => {
    const btn = ev.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Actualizando...';
    try {
      const result = await fetchJSON('/api/refresh', { method: 'POST' });
      if (result.warning) {
        showBanner(document.querySelector('.container') || document.body, result.warning, 'warning');
      }
      if (typeof window.onDataRefresh === 'function') {
        await window.onDataRefresh();
      } else {
        location.reload();
      }
    } catch (err) {
      showBanner(document.querySelector('.container') || document.body, err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });

  document.getElementById('btn-exit').addEventListener('click', async () => {
    const confirmed = confirm(
      'Esto apagara el servidor de la app para TODAS las personas conectadas en este momento. ¿Deseas continuar?'
    );
    if (!confirmed) return;
    try {
      await fetchJSON('/api/exit', { method: 'POST' });
    } catch (err) {
      // el servidor se apaga justo despues de responder; un error de red aqui es esperado
    }
    document.body.innerHTML =
      '<div style="padding:40px;text-align:center;font-family:sans-serif;color:#eef1fb;background:#0a1128;min-height:100vh;">' +
      '<h2>Servidor apagado</h2><p>La aplicacion ha cerrado sus procesos. Para volver a usarla, alguien debe iniciar el servidor de nuevo.</p></div>';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const active = document.body.dataset.page;
  renderNav(active);
});
