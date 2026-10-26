# Trabalho 2 — DevOps: AgendaFácil

## Produto
MVP web de agenda para cadastrar compromissos, consultar atendimentos por data, buscar por pessoa/serviço e acompanhar status. O sistema tem frontend, API Express e persistência SQLite.

## Executar localmente
Requer Node.js 20 ou superior.

```sh
npm install
npm start
```

Abra `http://localhost:3000`. O banco é criado em `data/agenda-facil.sqlite`. Para executar os testes de API: `npm test`. A checagem de sintaxe está disponível com `npm run check`.

## Funcionalidades e API
- `POST /api/appointments`: criar compromisso (pessoa, serviço e data/horário obrigatórios).
- `GET /api/appointments`: listar; aceita filtros `search`, `status` e `date`.
- `PATCH /api/appointments/:id`: editar compromisso ou atualizar o status.
- `DELETE /api/appointments/:id`: excluir compromisso.
- `GET /api/summary`: totais da agenda e compromissos de hoje.
- `GET /health`: estado do serviço e horário da verificação.

Os status são Agendado, Confirmado, Concluído e Cancelado. `src/app.js` contém API, validações e acesso ao SQLite; `public/` contém o frontend responsivo; `src/server.js` inicia e encerra o serviço.

## Git e pipeline DevOps
O projeto está versionado em Git local. Para a entrega, hospedar o código no GitHub e usar branches curtas `feature/nome`, commits pequenos e Pull Requests para a branch principal (`main` ou `master`). Os workflows aceitam os dois nomes.

- **CI:** `.github/workflows/ci.yml` roda em push e Pull Request para `main` ou `master`, instala dependências, verifica sintaxe e executa testes automatizados.
- **CD:** `.github/workflows/deploy.yml` publica no Railway após o CI bem-sucedido na branch principal. O workflow usa `RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID` e `RAILWAY_ENVIRONMENT_ID` protegidos nas configurações do repositório.
- **Verificação da publicação:** `railway.json` configura a rota `/health` como health check.
- **Persistência hospedada:** em produção, configurar volume Railway e `DB_FILE` para manter o SQLite após reinicializações.

O deploy está preparado e passa a rodar depois de publicar o repositório e configurar as credenciais Railway. Não grave tokens no código. Docker e Terraform foram omitidos porque infraestrutura como código é opcional na atividade.

## Testes e monitoramento
`test/app.test.js` cobre health check, validação de campos, cadastro, listagem, atualização de status, exclusão e compromisso inexistente. O endpoint `/health` e os logs JSON de inicialização, cadastro, edição e erro dão visibilidade operacional; no Railway, consulte o painel de logs.

## Processo Scrum
O trabalho Scrum correspondente está separado em `../01-trabalho-scrum`, com produto, blueprint de referência, fluxo Kanban, backlog priorizado de 15 itens e três user stories.

## Limites do MVP
Sem contas de usuário, notificações ou integração com calendários externos. A agenda é uma base acadêmica simples. A publicação externa exige conta e credenciais do estudante.

