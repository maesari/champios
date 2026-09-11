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
