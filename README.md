# AgendaFácil — Projeto DevOps

MVP web de agenda com interface, API Node.js/Express e banco SQLite.

## Arquitetura
- Frontend em public/ (HTML, CSS e JavaScript).
- Backend Express e regras da aplicação em src/app.js.
- Banco SQLite via better-sqlite3; padrão local: data/agenda-facil.sqlite.
- Inicialização e encerramento do servidor em src/server.js.

## Executar localmente
Requer Node.js 20 ou superior.

    npm install
    npm start

Acesse http://localhost:3000. Para as verificações do CI, execute npm run check e npm test. PORT e DB_FILE são configuráveis por ambiente; .env.example contém apenas valores de referência.

## Recursos
- Cadastrar, consultar, editar, atualizar status e excluir compromissos.
- Buscar por pessoa, serviço, observações, status e data.
- Consultar resumo diário e totais por status.
- Verificar disponibilidade em /health.

## Versionamento e CI
O código está hospedado em https://github.com/VitokaVTK/AgendaFacil. O workflow .github/workflows/ci.yml roda em push e Pull Request para main e master. Ele prepara Node.js 20, instala dependências, verifica a sintaxe e executa testes automatizados.

Os testes usam node:test, Supertest e SQLite em memória. Cobrem health check, campos obrigatórios, cadastro/listagem/edição/exclusão e resposta 404 para um compromisso inexistente.

## CD e publicação
O serviço Render está conectado ao repositório e à branch main. O auto deploy está configurado para ocorrer depois que os checks de CI passam. O processo inicia com npm start, usa PORT e verifica a disponibilidade por /health.

Aplicação: https://agendafacil-m8h2.onrender.com/

## Provisionamento e monitoramento
O serviço web foi provisionado no painel do Render, que gerencia a instância e a publicação. Infraestrutura como código foi omitida porque Docker/Compose ou Terraform são opcionais na atividade.

O endpoint /health retorna o estado do serviço. O backend emite logs JSON de inicialização, criação, edição, exclusão e erros de requisição; logs e métricas básicos estão disponíveis no painel do Render.

## Persistência e limites
O SQLite local é armazenado em data/agenda-facil.sqlite. Sem disco persistente no Render, o arquivo SQLite pode ser perdido quando a instância hospedada for substituída ou reiniciada. O MVP não inclui autenticação, notificações nem integrações externas.