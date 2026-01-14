# API Finance Transaction

The system uses a simple, hypothetical transaction object that only accepts `amount` with both positive and negative values.

## Database and ORM

The database used for the project is a PostgreSQL database managed by Prisma.

It is possible to define the database via the environment variable in the `.env` file:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finance_transaction?schema=public"
```

## Logger

PINO was used for structured logs. This allows the generation of structured logs suitable for observability systems.

It is possible to configure the log levels for display in the environment variable in the `.env` file:

```
LOG_LEVEL="info"
```

The accepted options are `trace`, `debug`, `info`, `warn`, `error`, `fatal`. By default, `info` is used.