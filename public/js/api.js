async function fetchJSON(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw { kind: 'no_internet', message: 'No se pudo conectar con el servidor de la app (revisa tu conexion a internet).' };
  }
  let body;
  try {
    body = await res.json();
  } catch (err) {
    throw { kind: 'unknown', message: 'El servidor respondio con datos invalidos.' };
  }
  if (!res.ok || body.ok === false) {
    throw { kind: body.error || 'unknown', message: body.message || 'Ocurrio un error inesperado.' };
  }
  return body;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function showBanner(container, message, type) {
  const div = document.createElement('div');
  div.className = `banner ${type}`;
  div.textContent = message;
  container.prepend(div);
  return div;
}

function teamLogoFallback(ev) {
  ev.target.src = '/img/ball-placeholder.svg';
}

// --- Modal generico compartido por todas las paginas (detalle de partido, ficha de jugador) ---
function ensureModalRoot() {
  let root = document.getElementById('shared-modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'shared-modal-root';
    document.body.appendChild(root);
  }
  return root;
}

function openModal(innerHtml) {
  const root = ensureModalRoot();
  root.innerHTML = `<div class="modal-overlay" id="shared-modal-overlay"><div class="modal-card">${innerHtml}</div></div>`;
  document.getElementById('shared-modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'shared-modal-overlay') closeModal();
  });
}

function closeModal() {
  const root = document.getElementById('shared-modal-root');
  if (root) root.innerHTML = '';
}

async function openMatchModal(matchId) {
  openModal('<button class="modal-close" onclick="closeModal()">&times;</button><div class="loading">Cargando detalle del partido...</div>');
  try {
    const result = await fetchJSON(`/api/matches/${matchId}`);
    const m = result.data;
    const played = m.status === 'FINISHED';
    const score = played
      ? `${m.goalsHome ?? '-'} - ${m.goalsAway ?? '-'}`
      : 'vs';
    openModal(`
      <button class="modal-close" onclick="closeModal()">&times;</button>
      <h2>${m.home.name} ${score} ${m.away.name}</h2>
      <div class="meta" style="color:var(--text-dim);margin-bottom:10px;">${m.round || ''} &middot; ${formatDate(m.date)}</div>
      ${
        played
          ? `<div class="modal-row"><span class="label">Marcador al descanso</span><span>${m.halfTimeHome ?? '-'} - ${m.halfTimeAway ?? '-'}</span></div>`
          : '<div class="modal-row"><span class="label">Estado</span><span>Aun no jugado</span></div>'
      }
      <div class="modal-row"><span class="label">Estadio</span><span>${m.venue || 'No disponible'}</span></div>
      ${played ? `<div class="modal-row"><span class="label">Arbitro</span><span>${m.referee || 'No disponible'}</span></div>` : ''}
      <p class="search-hint" style="margin-top:14px;">Estadisticas detalladas del partido (posesion, tiros, goleadores, tarjetas) no estan disponibles en el plan gratuito de la fuente de datos usada por esta app.</p>
    `);
  } catch (err) {
    openModal(`<button class="modal-close" onclick="closeModal()">&times;</button><div class="banner error">${err.message}</div>`);
  }
}
