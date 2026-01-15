# Finance Transaction API

API de transações financeiras construída com NestJS, Prisma, Postgres e Redis, focada em:
- Registro de transações de débito/crédito por conta
- Garantia de idempotência em janelas de tempo configuráveis
- Processamento assíncrono via fila (BullMQ) com worker dedicado
- Tratamento consistente de erros de domínio (`AppError`) até a borda HTTP

---

## Stack e principais componentes

- **Node.js / NestJS**: framework principal da API
- **Postgres + Prisma**: persistência das transações
- **Redis + BullMQ (@nestjs/bullmq)**: fila de processamento das transações
- **Pino / nestjs-pino**: logs estruturados
- **Swagger**: documentação via `/docs`

Estrutura relevante:
- `src/core/transactions`: regras de negócio de transações (DTOs, repositórios, serviços)
- `src/infra/db/prisma`: acesso a banco via Prisma
- `src/infra/queue`: fila BullMQ, worker e serviço de integração com a API
- `src/support/errors`: erros de domínio (`AppError*`) e filtro global HTTP

---

## Como rodar o projeto

### 1. Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

### 2. Subir infraestrutura (Postgres + Redis)

Na raiz do projeto:

```bash
docker compose up -d
```

Isso sobe:
- Postgres em `localhost:5432`
- Redis em `localhost:6379`

### 3. Configurar variáveis de ambiente

Arquivo: `.env`

Valores padrão esperados:

```env
PORT=3000
LOG_LEVEL="debug" # trace, debug, info, warn, error, fatal
DATABASE_URL="postgresql://finance:finance@localhost:5432/finance_db?schema=public"
REDIS_URL="redis://localhost:6379"
IDEMPOTENCY_SECONDS=30
```

### 4. Instalar dependências

```bash
npm install
```

### 5. Rodar migrações do Prisma

```bash
npx prisma migrate dev
```

Isso cria/aplica o schema da base de dados no Postgres configurado.

### 6. Subir a aplicação

```bash
npm run dev
```

A API ficará disponível em:

- HTTP: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`

---

## Fluxo de criação de transação

1. O controller chama o `TransactionsService`.
2. O `TransactionsService` gera um `id` (uuid v7), monta o payload da transação e:
   - Enfileira o job na fila `transactionQueue` via `QueueService`.
   - Chama `addAndAwaitCompletion`, que aguarda o worker concluir o processamento usando `waitUntilFinished`.
3. O `QueueProcessor` consome o job, chama `CreateTransactionService`:
   - Aplica regras de saldo e idempotência.
   - Persiste a transação via `TransactionRepository`/Prisma.
4. Em caso de sucesso, o resultado volta pela fila e é retornado ao cliente.
5. Em caso de erro de domínio (`AppError`), o worker serializa o erro e o `QueueService` reconstrói uma `HttpException`, garantindo que o status HTTP (409, 400, etc.) chegue corretamente ao controller.

---

## Alto volume de requisições simultâneas

### Onde estaria o gargalo nesta implementação

- **Uso síncrono da fila**:
  - A API chama a fila e **espera o job terminar** (`waitUntilFinished`) antes de responder.
  - Cada requisição HTTP fica bloqueada até o worker concluir o processamento.
- **Capacidade limitada do worker**:
  - Se o worker tiver baixa concorrência (poucos workers/processos), a taxa máxima de throughput fica limitada ao que ele processa.
  - Em picos, jobs se acumulam na fila e o tempo de resposta HTTP cresce rapidamente.
- **Acesso ao banco**:
  - Cálculo de saldo e consultas de idempotência são feitas em tempo real.
  - Em alto volume, Postgres pode virar gargalo por contenda em índices/locks, principalmente se o padrão de carga for concentrado em poucas contas.

Em resumo: o gargalo primário é o **acoplamento entre o tempo de processamento do worker e o SLA HTTP**, por causa do `waitUntilFinished`.

### Qual seria o primeiro problema real em produção

- Em picos de carga:
  - Jobs começam a demorar mais para serem processados.
  - As requisições HTTP continuam esperando o resultado da fila.
  - Quando o tempo do job se aproxima ou excede o `timeoutMs` configurado, começam a surgir:
    - Respostas HTTP 500/timeout no edge (API Gateway / Load Balancer).
    - Clientes fazendo **retry** por acreditarem que a requisição falhou.
- Isso leva a:
  - **Efeito cascata de retries**, aumentando ainda mais a fila.
  - Possível duplicação de intenção da transação (mesmo cliente tentando várias vezes).
  - Crescimento de jobs pendentes no Redis (memória) e aumento da latência média.

O primeiro sintoma perceptível seria **degradação de latência** seguida de **erros 5xx** sob alto volume, mesmo com regras de negócio corretas.

### Qual solução você priorizaria primeiro e por quê

**Solução priorizada:** tornar o fluxo de criação de transação **assíncrono na borda HTTP**, sem `waitUntilFinished`.

- A API:
  - Enfileira a transação.
  - Retorna **202 Accepted** com um identificador de job/transação.
- O cliente:
  - Consulta um endpoint de status ou recebe o resultado por outro canal (webhook, stream, etc.).

Por que essa seria minha primeira prioridade:

- **Desacopla o SLA HTTP** do tempo de processamento do worker.
- Permite:
  - Aumentar o número de workers de forma independente.
  - Fazer balanceamento horizontal sem pressionar o tempo de resposta da API.
- Evita que picos de carga se traduzam diretamente em timeouts na borda.

Depois dessa mudança, eu priorizaria:

1. **Aumentar a concorrência do worker** (mais processos/instâncias).
2. Adicionar **configuração explícita de retry/backoff + DLQ** na fila.
3. Otimizar consultas de saldo e idempotência (índices, estratégias de agregação, eventualmente cache de leitura).

---

## Arquitetura & Decisões

### Por que você organizou o projeto dessa forma?

- Separação em camadas claras:
  - **`core/transactions`**: regras de negócio, DTOs, serviços e repositórios.
  - **`infra/db/prisma`**: detalhes de persistência e ORM.
  - **`infra/queue`**: integração com BullMQ/Redis (fila, worker, serviço).
  - **`support/errors`**: erros de domínio e conversão para HTTP.
- Benefícios:
  - Facilita testes unitários (mocks de repositório, fila, etc.).
  - Permite trocar infraestrutura (banco, fila) com impacto mínimo na camada de domínio.
  - Mantém o controller fino, delegando lógica para serviços especializados.

### Onde você colocaria cache? Quando não colocaria?

Eu colocaria cache principalmente em:

- **Consultas de leitura intensiva e baixa volatilidade**, por exemplo:
  - Listagens agregadas de saldo por conta.
  - Resumos de transações em janelas (últimas N transações) para dashboards.
- **Configurações raramente alteradas**, se forem trazidas do banco ou de outro serviço.

Eu **não** colocaria cache em:

- Fluxo crítico de **criação de transações** (escrita):
  - Precisa de consistência forte com o banco.
  - Atualizações frequentes tornam o cache difícil de manter coerente.
- Trechos já protegidos por **regras de idempotência** e constraints de banco, onde o risco de inconsistência de cache é maior que o ganho.

Na prática, usaria Redis tanto como backend de fila quanto como camada de cache de leitura, isolando as keys de cache em namespaces específicos.

### Como garantiria observabilidade em produção?

- **Logs estruturados** (já usando `nestjs-pino`):
  - Inclusão de correlação (request id, account id, job id).
  - Logs separados por contexto (API, worker, fila).
- **Métricas**:
  - Expor métricas Prometheus/Grafana para:
    - Latência de requests HTTP.
    - Tamanho da fila e tempo de espera dos jobs.
    - Taxa de sucesso/falha por tipo de erro (domínio vs infra).
    - Performance do banco (tempo de query, conexões ativas).
- **Tracing distribuído**:
  - OpenTelemetry integrando API, worker e banco.
  - Permite seguir uma transação desde o POST até o commit no banco, mesmo passando por fila.
- **Alertas**:
  - Alertas em:
    - Aumento de 5xx.
    - Crescimento anormal da fila.
    - Tempo médio de processamento de job acima de um limiar.

### Em que cenário você usaria fila/mensageria?

Além do fluxo já implementado de criação de transações, usaria fila/mensageria quando:

- O processamento for **mais lento** que o tempo aceitável de resposta HTTP.
- Houver necessidade de:
  - Reprocessar ou aplicar **retry/backoff** de forma controlada.
  - Integrar com **serviços externos** pouco confiáveis (pagamentos, notificações, conciliações).
  - **Desacoplar** o produtor (API) do consumidor (worker) para escalar de forma independente.

Exemplos:
- Envio de notificações (e-mail/SMS/push).
- Conciliação de extratos com terceiro.
- Geração de relatórios pesados.

### O que você deixaria como dívida técnica consciente?

Alguns pontos que eu marcaria como dívida técnica controlada:

- **Fluxo ainda síncrono com fila**:
  - Mesmo com a propagação correta de erros, o uso de `waitUntilFinished` amarra o SLA HTTP ao worker.
  - Transformar o endpoint em assíncrono (202 + consulta de status) seria uma evolução futura planejada.
- **Sem mecanismo completo de DLQ e retry configurável** na fila:
  - Hoje o foco é garantir o fluxo básico de sucesso/erro.
  - Em produção, valeria adicionar:
    - Fila de dead-letter.
    - Políticas de retry diferenciadas por tipo de erro.
- **Modelo de saldo ainda centralizado no banco**:
  - Em alto volume, poderia ser necessário:
    - Introduzir estratégias de sharding ou particionamento por conta.
    - Avaliar mecanismos de locking otimizados ou uso de eventos + projeções.
- **Cache ainda não explorado**:
  - O primeiro objetivo é ter regras de negócio corretas e consistentes.
  - Cache de leitura pode ser introduzido depois, com cuidado para não mascarar inconsistências.

Essas dívidas são aceitáveis na fase atual porque o objetivo principal é ter um fluxo funcional, testável e com semântica de domínio clara. As melhorias citadas são incrementais e podem ser introduzidas em aplicações reais.

