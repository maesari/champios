async function renderNav(active) {
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

  let localMode = false;
  try {
    const config = await fetchJSON('/api/config');
    localMode = Boolean(config.localMode);
  } catch (err) {
    localMode = false; // si no se puede confirmar, no se muestra el boton Salir por seguridad
  }

  const nav = document.createElement('div');
  nav.className = 'navbar';
  nav.innerHTML = `
    <div class="navbar-inner">
      <div class="brand"><span class="ball">&#9917;</span> UEFA Champions League</div>
      <div class="nav-links">${links}</div>
      <div class="nav-actions">
        <button class="nav-btn btn-refresh" id="btn-refresh">Actualizar resultados</button>
        ${localMode ? '<button class="nav-btn btn-exit" id="btn-exit">Salir</button>' : ''}
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

  if (localMode) {
    document.getElementById('btn-exit').addEventListener('click', async () => {
      const confirmed = confirm(
        'Esto apagara el servidor que corre en esta computadora. ¿Deseas continuar?'
      );
      if (!confirmed) return;
      try {
        await fetchJSON('/api/exit', { method: 'POST' });
      } catch (err) {
        // el servidor se apaga justo despues de responder; un error de red aqui es esperado
      }
      document.body.innerHTML =
        '<div style="padding:40px;text-align:center;font-family:sans-serif;color:#eef1fb;background:#0a1128;min-height:100vh;">' +
        '<h2>Servidor apagado</h2><p>La aplicacion cerro el proceso en esta computadora. Para volver a usarla, alguien debe iniciar el servidor de nuevo.</p></div>';
    });

    // Aviso periodico al servidor local de que sigue habiendo una pestana abierta;
    // si dejan de llegar (se cerraron todas las pestanas), el servidor se apaga solo.
    const sendHeartbeat = () => fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
    sendHeartbeat();
    setInterval(sendHeartbeat, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const active = document.body.dataset.page;
  renderNav(active);
});
