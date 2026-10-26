const fs = require('node:fs');
const path = require('node:path');
const { createApp } = require('./app');
const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'agenda-facil.sqlite');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });
const app = createApp({ dbFile });
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => console.log(JSON.stringify({ event: 'server_started', port })));
function shutdown() { server.close(() => { app.locals.db.close(); process.exit(0); }); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
