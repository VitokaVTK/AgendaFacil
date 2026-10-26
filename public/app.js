const list = document.querySelector('#appointments');
const form = document.querySelector('#form');
const notice = document.querySelector('#notice');
const statuses = ['Agendado', 'Confirmado', 'Concluído', 'Cancelado'];

async function api(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Error(body.error || 'Não foi possível concluir a solicitação.');
  }
  return response.status === 204 ? null : response.json();
}

function show(message, isError = false) {
  notice.textContent = message;
  notice.className = `notice${isError ? ' error' : ''}`;
}

async function load() {
  const params = new URLSearchParams();
  const search = document.querySelector('#search').value.trim();
  const status = document.querySelector('#statusFilter').value;
  const date = document.querySelector('#dateFilter').value;
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  if (date) params.set('date', date);
  try {
    const [items, summary] = await Promise.all([api(`/api/appointments?${params}`), api('/api/summary')]);
    renderItems(items);
    renderStats(summary);
  } catch (error) {
    list.innerHTML = '<p class="empty">Não foi possível carregar a agenda. Verifique se o sistema está disponível.</p>';
    show(error.message, true);
  }
}

function renderStats(summary) {
  const cards = [
    ['Total', summary.total, 'total'],
    ['Hoje', summary.today, 'hoje'],
    ['Confirmados', summary.byStatus.Confirmado, 'confirmado'],
    ['Concluídos', summary.byStatus.Concluído, 'concluido']
  ];
  document.querySelector('#stats').replaceChildren(...cards.map(([label, value, color]) => {
    const card = document.createElement('article'); card.className = `stat ${color}`;
    const number = document.createElement('strong'); number.textContent = value;
    const caption = document.createElement('span'); caption.textContent = label;
    card.append(number, caption); return card;
  }));
}

function formatDate(value) {
  const [date, time] = value.split('T');
  const [year, month, day] = date.split('-');
  return { date: `${day}/${month}/${year}`, time };
}

function renderItems(items) {
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Nenhum compromisso encontrado. Cadastre o primeiro acima.'; list.append(empty); return;
  }
  items.forEach(item => {
    const card = document.createElement('article'); card.className = 'appointment-card';
    const top = document.createElement('div'); top.className = 'appointment-top';
    const heading = document.createElement('div');
    const name = document.createElement('h3'); name.textContent = item.client;
    const service = document.createElement('p'); service.className = 'service'; service.textContent = item.service;
    heading.append(name, service);
    const badge = document.createElement('span'); badge.className = `badge status-${item.status.toLowerCase()}`; badge.textContent = item.status;
    top.append(heading, badge);
    const { date, time } = formatDate(item.scheduled_at);
    const when = document.createElement('p'); when.className = 'when'; when.textContent = `${date} · ${time}`;
    card.append(top, when);
    if (item.notes) { const notes = document.createElement('p'); notes.className = 'details'; notes.textContent = item.notes; card.append(notes); }
    const controls = document.createElement('div'); controls.className = 'card-controls';
    const select = document.createElement('select'); select.setAttribute('aria-label', `Status do compromisso de ${item.client}`);
    statuses.forEach(status => { const option = document.createElement('option'); option.value = status; option.textContent = status; option.selected = status === item.status; select.append(option); });
    select.onchange = async () => { try { await api(`/api/appointments/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) }); show('Status atualizado.'); load(); } catch (error) { show(error.message, true); } };
    const edit = document.createElement('button'); edit.className = 'edit'; edit.textContent = 'Editar';
    edit.onclick = async () => {
      const client = window.prompt('Nome da pessoa:', item.client); if (client === null) return;
      const serviceName = window.prompt('Serviço ou compromisso:', item.service); if (serviceName === null) return;
      const scheduledAt = window.prompt('Data e horário (AAAA-MM-DDTHH:mm):', item.scheduled_at); if (scheduledAt === null) return;
      const notes = window.prompt('Observações:', item.notes); if (notes === null) return;
      try { await api(`/api/appointments/${item.id}`, { method: 'PATCH', body: JSON.stringify({ client, service: serviceName, scheduledAt, notes }) }); show('Compromisso atualizado.'); load(); }
      catch (error) { show(error.message, true); }
    };
    const remove = document.createElement('button'); remove.className = 'delete'; remove.textContent = 'Excluir'; remove.setAttribute('aria-label', `Excluir compromisso de ${item.client}`);
    remove.onclick = async () => { if (!window.confirm(`Excluir o compromisso de ${item.client}?`)) return; try { await api(`/api/appointments/${item.id}`, { method: 'DELETE' }); show('Compromisso excluído.'); load(); } catch (error) { show(error.message, true); } };
    controls.append(select, edit, remove); card.append(controls); list.append(card);
  });
}

form.onsubmit = async event => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(form).entries());
  try { await api('/api/appointments', { method: 'POST', body: JSON.stringify(body) }); form.reset(); show('Compromisso adicionado à agenda.'); load(); }
  catch (error) { show(error.message, true); }
};

let searchTimer;
document.querySelector('#search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(load, 200); });
document.querySelector('#statusFilter').addEventListener('change', load);
document.querySelector('#dateFilter').addEventListener('change', load);
document.querySelector('#clearDate').addEventListener('click', () => { document.querySelector('#dateFilter').value = ''; load(); });
api('/health').then(result => { document.querySelector('#health').textContent = `Sistema ${result.status}`; }).catch(() => { document.querySelector('#health').textContent = 'Sistema indisponível'; });
load();
