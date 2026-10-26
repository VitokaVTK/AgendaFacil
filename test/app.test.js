const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/app');
const app = createApp({ dbFile: ':memory:', logger: { info() {}, error() {} } });
after(() => app.locals.db.close());
test('health endpoint reports service status', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200); assert.equal(res.body.status, 'ok');
});
test('rejects an appointment without required fields', async () => {
  const res = await request(app).post('/api/appointments').send({ client: '  ', service: '', scheduledAt: '' });
  assert.equal(res.status, 400); assert.match(res.body.error, /cliente/);
});
test('creates, lists, updates and deletes an appointment', async () => {
  const created = await request(app).post('/api/appointments').send({ client: ' Ana ', service: ' Consulta ', scheduledAt: '2026-11-10T14:30', notes: ' Inicial ' });
  assert.equal(created.status, 201); assert.equal(created.body.client, 'Ana');
  const listed = await request(app).get('/api/appointments'); assert.equal(listed.body.length, 1);
  const updated = await request(app).patch(`/api/appointments/${created.body.id}`).send({ status: 'Confirmado' });
  assert.equal(updated.body.status, 'Confirmado');
  const deleted = await request(app).delete(`/api/appointments/${created.body.id}`); assert.equal(deleted.status, 204);
});
test('returns 404 for an unknown appointment', async () => {
  const res = await request(app).patch('/api/appointments/999').send({ status: 'Confirmado' });
  assert.equal(res.status, 404);
});
