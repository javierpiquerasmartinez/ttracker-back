# Slott — Backend

Backend de **Slott**, aplicación de registro y análisis de horas de trabajo para freelancers.

Construido con NestJS + TypeORM + PostgreSQL. Genera reportes en PDF con PDFKit.

## Requisitos

- Node.js >= 20
- pnpm
- PostgreSQL (recomendado: Neon serverless)

## Puesta en marcha

```bash
pnpm install
```

Configura las variables de entorno (copia `.env.example` a `.env`):

```env
DATABASE_URL=postgres://user:password@host/db?sslmode=require
JWT_SECRET=change-me-in-production
PORT=3000
```

Arranca en modo desarrollo:

```bash
pnpm run start:dev
```

La API se sirve en `http://localhost:3000`.

## Usuario semilla

Al arrancar, el módulo `SeedService` asegura que exista el usuario `admin@slott.com` (password `admin123`). Si existe el usuario legacy `admin@ttracker.com`, su email se migra in-place a `admin@slott.com` conservando el id y todos los datos asociados.

## Scripts

| Script | Descripción |
|--------|-------------|
| `pnpm run start:dev` | Servidor con watch |
| `pnpm run build` | Compila con `nest build` |
| `pnpm run start:prod` | Ejecuta el build (`node dist/main`) |
| `pnpm run lint` | ESLint con autofix |
| `pnpm run test` | Tests unitarios (Jest) |

## Estructura

```
src/
├── auth/          login, registro, JWT, rate limiting
├── clients/       CRUD de clientes
├── projects/      CRUD de proyectos
├── time-records/  CRUD de registros + exportación PDF
├── dashboard/     agregados para el dashboard
├── users/         entidad User
├── migrations/    migraciones versionadas (TypeORM)
├── database/      configuración TypeORM + seed
└── app.module.ts
data-source.ts     DataSource para la CLI de migraciones
scripts/           utilidades (introspección read-only, SQL de baseline)
```

## Migraciones

El esquema se gestiona con **migraciones versionadas** (`synchronize: false` +
`migrationsRun: true`). Al arrancar, TypeORM crea la tabla `migrations` si no
existe y aplica las migraciones pendientes.

### Scripts

| Script | Descripción |
|--------|-------------|
| `pnpm migration:show` | Lista migraciones pendientes/ejecutadas |
| `pnpm migration:generate src/migrations/Nombre` | Genera una migración a partir del diff entidades ↔ BD |
| `pnpm migration:run` | Aplica migraciones pendientes |
| `pnpm migration:revert` | Revierte la última migración |

`migration:generate` y `migration:show` usan `data-source.ts` (raíz) vía
`typeorm-ts-node-commonjs`, así que leen `.env` automáticamente.

### Adopción sobre una BD existente (ya ejecutado en producción)

La base de datos actual fue creada con `synchronize: true`. Para pasar a
migraciones sin perder datos se hizo lo siguiente (one-time):

1. Se escribió `src/migrations/1719139200000-InitialSchema.ts` replicando el
   esquema exacto (nombres de constraints verificados contra la BD). Es
   idempotente: usa `CREATE TABLE IF NOT EXISTS` con constraints inline, así
   que aunque se ejecute sobre la BD existente es un no-op.
2. Se ejecutó `scripts/mark-baseline-run.sql` contra producción para crear la
   tabla `migrations` y registrar la baseline como ya ejecutada (sin tocar
   tablas de datos).
3. Se cambió `app.module.ts` a `synchronize: false` + `migrationsRun: true`.

> Si se despliega en una BD nueva (vacía), no hace falta el paso 2: al arrancar
> la app la baseline se ejecuta y crea el esquema completo.

### Flujo para un cambio de esquema futuro

1. Modifica la entidad correspondiente.
2. `pnpm migration:generate src/migrations/DescribeElCambio`
3. Revisa el fichero generado (up/down).
4. Commit + deploy. La app aplica la migración al arrancar.
5. Verifica con `pnpm migration:show` (debe quedar todo `[X]`).

### Verificación de drift

`pnpm migration:generate src/migrations/Check` responde `No changes in
database schema were found` cuando las entidades y la BD coinciden. Es una
comprobación read-only útil antes de desplegar.
