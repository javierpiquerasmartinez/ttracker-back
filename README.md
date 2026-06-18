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
├── database/      configuración TypeORM + seed
└── app.module.ts
```

> Nota: `synchronize: true` está activo. No hay sistema de migraciones; el esquema se sincroniza desde las entidades al arrancar.
