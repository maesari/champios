require('dotenv').config();
const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api');
const {
  IS_SHARED_DEPLOYMENT,
  HEARTBEAT_STARTUP_GRACE_MS,
  HEARTBEAT_IDLE_GRACE_MS,
} = require('./src/config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', apiRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (req, res) => {
  res.json({ localMode: !IS_SHARED_DEPLOYMENT });
});

if (!IS_SHARED_DEPLOYMENT) {
  // Modo local: si nadie tiene la app abierta en el navegador, el servidor se
  // apaga solo para no dejar el proceso corriendo y gastando recursos.
  const startedAt = Date.now();
  let lastHeartbeat = null;

  app.post('/api/heartbeat', (req, res) => {
    lastHeartbeat = Date.now();
    res.sendStatus(204);
  });

  setInterval(() => {
    const now = Date.now();
    if (lastHeartbeat === null) {
      if (now - startedAt > HEARTBEAT_STARTUP_GRACE_MS) {
        console.log('Nadie abrio la app despues de iniciar el servidor. Apagando...');
        process.exit(0);
      }
      return;
    }
    if (now - lastHeartbeat > HEARTBEAT_IDLE_GRACE_MS) {
      console.log('Se cerraron todas las pestanas de la app. Apagando el servidor local...');
      process.exit(0);
    }
  }, 5000);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Champions League app corriendo en el puerto ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
});
