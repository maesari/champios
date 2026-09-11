# Champions League App

App web en Node.js + Express que muestra resultados, tabla de posiciones, equipos, plantillas y proximos partidos de la UEFA Champions League (rama varonil), usando la API gratuita **football-data.org**.

## 1. Obtener un token gratuito

1. Entra a https://www.football-data.org/client/register y crea una cuenta gratuita (el token llega al instante por correo).
2. Copia tu **API Token**.

> Nota: el plan gratuito de football-data.org permite 10 solicitudes por minuto y **si incluye la temporada actual** de la Champions League (tabla, resultados, proximos partidos). Lo unico que no incluye gratis son las estadisticas de jugadores (goles/asistencias/tarjetas) de la temporada en curso; por eso la seccion de plantilla muestra nombre, posicion, nacionalidad y edad, con un aviso explicando esa limitacion.

## 2. Correr la app en tu computadora

```bash
npm install
```

Copia `.env.example` a `.env` y pega tu token:

```
FOOTBALL_DATA_TOKEN=tu_token_aqui
PORT=3000
```

Inicia la app:

```bash
npm start
```

Abre en tu navegador: http://localhost:3000

## 3. Compartir en tu red local (WiFi)

Con la app corriendo, busca la IP local de tu computadora (en Windows: `ipconfig`, busca "Direccion IPv4", ej. `192.168.1.50`). Otras personas conectadas al mismo WiFi pueden abrir `http://192.168.1.50:3000` desde su celular o computadora, sin instalar nada.

## 4. Publicarla en internet gratis (Render)

Para que cualquier persona la use desde cualquier red con una sola liga (URL):

1. Sube este proyecto a un repositorio de GitHub.
2. Crea una cuenta gratuita en https://render.com.
3. En Render, "New" -> "Web Service", conecta tu repositorio.
4. Render detectara el archivo `render.yaml`. Si te pide configurarlo manualmente:
   - Build command: `npm install`
   - Start command: `npm start`
5. En la seccion de variables de entorno, agrega `FOOTBALL_DATA_TOKEN` con tu token.
6. Da clic en "Create Web Service" y espera el deploy.
7. Comparte la URL publica que te da Render (ej. `https://champios.onrender.com`) con quien quieras.

**Nota:** el plan gratuito de Render "duerme" el servicio tras un rato sin visitas; la primera carga despues de eso puede tardar unos 30-50 segundos mientras despierta.

## Botones de la app

- **Actualizar resultados**: fuerza una actualizacion de la tabla, resultados y proximos partidos (con un limite de una vez por minuto para cuidar la cuota gratuita de la API).
- **Salir**: solo aparece cuando corres la app en tu propia computadora (`npm start`). Apaga el proceso local. **No aparece ni funciona en el servicio compartido de Render** (la app detecta automaticamente si esta corriendo ahi mediante la variable `RENDER` que Render define sola) para no afectar a otras personas conectadas.
- **Apagado automatico por inactividad (solo local)**: cuando corres la app en tu computadora, cada pestana del navegador le avisa al servidor cada 5 segundos que sigue abierta. Si cierras todas las pestanas (o nunca abriste ninguna en el primer minuto), el servidor se apaga solo para no quedar consumiendo recursos en segundo plano.

## Limitaciones conocidas

- El plan gratuito de football-data.org permite 10 solicitudes por minuto; el servidor cachea los datos por 10 minutos y limita internamente sus propias llamadas para no exceder ese limite.
- Las estadisticas detalladas de jugadores (goles, asistencias, tarjetas) de la temporada actual no estan disponibles en el plan gratuito de ningun proveedor de datos deportivos conocido; requieren un plan de paga. La app muestra la plantilla (nombre, posicion, nacionalidad, edad) y lo indica claramente.
- El historial completo de participaciones pasadas de cada club en la Champions League tampoco esta disponible en el plan gratuito.
- Si el servidor no tiene internet, el token no es valido, o se agoto el limite de solicitudes, la app muestra un mensaje explicando el motivo en vez de fallar en silencio.
