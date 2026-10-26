# Relatório técnico — DevOps do AgendaFácil

## 1. Produto
O AgendaFácil é um MVP web para organizar compromissos. Permite cadastrar, consultar, pesquisar, editar, alterar status e excluir compromissos.

## 2. Arquitetura
- Frontend: HTML, CSS e JavaScript em public/.
- Backend: Node.js 20 e Express em src/.
- Banco de dados: SQLite com better-sqlite3.
- Endpoints: /api/appointments, /api/summary e /health.

## 3. Controle de versão
O projeto está hospedado em https://github.com/VitokaVTK/AgendaFacil. A branch publicada é main. O fluxo recomendado usa branches curtas, commits pequenos e Pull Requests para revisão.

## 4. Integração contínua (CI)
O workflow .github/workflows/ci.yml roda em push e Pull Request para main e master. Etapas: baixar o código, preparar Node.js 20, instalar dependências com npm install, verificar sintaxe com npm run check e executar os testes com npm test.

Os testes usam node:test, Supertest e SQLite em memória. Cobrem health check, validação de campos obrigatórios, operações de cadastro/listagem/atualização/exclusão e resposta 404 para registro inexistente. Um check reprovado sinaliza a falha antes da publicação.

## 5. Entrega contínua (CD)
O serviço Render está conectado ao repositório GitHub e à branch main. Auto deploy está definido como After CI Checks Pass.

Fluxo: alteração integrada à main → execução do CI no GitHub Actions → após checks aprovados, publicação do commit pelo Render → inicialização por npm start → verificação do serviço por /health.

Aplicação: https://agendafacil-m8h2.onrender.com/. A publicação é gerenciada pela integração GitHub–Render.

## 6. Provisionamento
O serviço web e os parâmetros de execução foram configurados no painel do Render, que gerencia a instância e o processo de publicação. Docker/Compose e Terraform são recursos opcionais de infraestrutura como código na atividade; essa etapa opcional não foi implementada.

Parâmetros: repositório VitokaVTK/AgendaFacil; branch main; comando de instalação npm install; comando de início npm start; porta fornecida por PORT; health check em /health.

## 7. Monitoramento
- GET /health retorna status, nome do serviço e horário da verificação.
- O backend registra eventos JSON de início, criação, edição, exclusão e erros.
- Logs e métricas básicos podem ser consultados no painel do Render.

## 8. Configuração e segurança
PORT e DB_FILE são configuráveis por ambiente. .env.example contém valores de referência. .gitignore exclui .env, dados locais, dependências instaladas e arquivos de log.

## 9. Persistência e limitações
Em desenvolvimento local, o arquivo padrão do SQLite fica em data/agenda-facil.sqlite. Sem disco persistente configurado no Render, o arquivo de banco hospedado pode ser perdido após substituição ou reinício da instância. O MVP não inclui autenticação, notificações ou integração com calendários externos.

## 10. Arquivos principais
- .github/workflows/ci.yml — integração contínua.
- src/app.js — endpoints, validações e acesso ao SQLite.
- src/server.js — inicialização e encerramento do serviço.
- test/app.test.js — testes automatizados da API.
- .env.example — variáveis de ambiente de referência.