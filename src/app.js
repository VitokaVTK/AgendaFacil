const express = require('express');
const path = require('node:path');
const Database = require('better-sqlite3');

const STATUSES = ['Agendado', 'Confirmado', 'Concluído', 'Cancelado'];

function isValidLocalDateTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const [date, time] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const parsed = new Date(year, month - 1, day, hour, minute);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day && parsed.getHours() === hour && parsed.getMinutes() === minute;
}

function createApp({ dbFile = process.env.DB_FILE || './data/agenda-facil.sqlite', logger = console } = {}) {
  const app = express();
  const db = new Database(dbFile);
  db.pragma('journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client TEXT NOT NULL,
    service TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Agendado',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  app.locals.db = db;
  app.use(express.json({ limit: '32kb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'agenda-facil', timestamp: new Date().toISOString() }));

  app.get('/api/appointments', (req, res) => {
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const date = String(req.query.date || '').trim();
    let sql = 'SELECT * FROM appointments WHERE 1 = 1';
    const params = [];
    if (search) {
      sql += ' AND (client LIKE ? OR service LIKE ? OR notes LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status && STATUSES.includes(status)) { sql += ' AND status = ?'; params.push(status); }
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) { sql += ' AND substr(scheduled_at, 1, 10) = ?'; params.push(date); }
    sql += ' ORDER BY scheduled_at ASC, id ASC';
    res.json(db.prepare(sql).all(...params));
  });

  app.get('/api/summary', (_req, res) => {
    const counts = Object.fromEntries(STATUSES.map(status => [status, 0]));
    for (const row of db.prepare('SELECT status, COUNT(*) AS total FROM appointments GROUP BY status').all()) counts[row.status] = row.total;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayTotal = db.prepare('SELECT COUNT(*) AS total FROM appointments WHERE substr(scheduled_at, 1, 10) = ?').get(today).total;
    res.json({ total: Object.values(counts).reduce((sum, count) => sum + count, 0), today: todayTotal, byStatus: counts });
  });

  app.post('/api/appointments', (req, res) => {
    const client = typeof req.body.client === 'string' ? req.body.client.trim() : '';
    const service = typeof req.body.service === 'string' ? req.body.service.trim() : '';
    const scheduledAt = typeof req.body.scheduledAt === 'string' ? req.body.scheduledAt.trim() : '';
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';
    if (!client || !service || !scheduledAt) return res.status(400).json({ error: 'Informe cliente, serviço, data e horário.' });
    if (client.length > 100 || service.length > 100 || notes.length > 1000) return res.status(400).json({ error: 'Revise o tamanho dos campos informados.' });
    if (!isValidLocalDateTime(scheduledAt)) return res.status(400).json({ error: 'Informe uma data e horário válidos.' });
    const result = db.prepare('INSERT INTO appointments (client, service, scheduled_at, notes) VALUES (?, ?, ?, ?)').run(client, service, scheduledAt, notes);
    logger.info?.(JSON.stringify({ event: 'appointment_created', appointmentId: result.lastInsertRowid }));
    res.status(201).json(db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid));
  });

  app.patch('/api/appointments/:id', (req, res) => {
    const id = Number(req.params.id);
    const current = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'Compromisso não encontrado.' });
    const client = req.body.client === undefined ? current.client : (typeof req.body.client === 'string' ? req.body.client.trim() : '');
    const service = req.body.service === undefined ? current.service : (typeof req.body.service === 'string' ? req.body.service.trim() : '');
    const scheduledAt = req.body.scheduledAt === undefined ? current.scheduled_at : req.body.scheduledAt;
    const notes = req.body.notes === undefined ? current.notes : (typeof req.body.notes === 'string' ? req.body.notes.trim() : '');
    const status = req.body.status === undefined ? current.status : req.body.status;
    if (!client || !service || !scheduledAt) return res.status(400).json({ error: 'Cliente, serviço, data e horário são obrigatórios.' });
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Status inválido.' });
    if (!isValidLocalDateTime(scheduledAt)) return res.status(400).json({ error: 'Informe uma data e horário válidos.' });
    if (client.length > 100 || service.length > 100 || notes.length > 1000) return res.status(400).json({ error: 'Revise o tamanho dos campos informados.' });
    db.prepare('UPDATE appointments SET client = ?, service = ?, scheduled_at = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(client, service, scheduledAt, notes, status, id);
    logger.info?.(JSON.stringify({ event: 'appointment_updated', appointmentId: id, status }));
    res.json(db.prepare('SELECT * FROM appointments WHERE id = ?').get(id));
  });

  app.delete('/api/appointments/:id', (req, res) => {
    const result = db.prepare('DELETE FROM appointments WHERE id = ?').run(Number(req.params.id));
    if (!result.changes) return res.status(404).json({ error: 'Compromisso não encontrado.' });
    logger.info?.(JSON.stringify({ event: 'appointment_deleted', appointmentId: Number(req.params.id) }));
    res.status(204).end();
  });

  app.use((err, _req, res, _next) => {
    logger.error?.(JSON.stringify({ event: 'request_error', message: err.message }));
    res.status(500).json({ error: 'Erro interno do servidor.' });
  });
  return app;
}

module.exports = { createApp, STATUSES };
