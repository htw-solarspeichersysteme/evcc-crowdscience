# Agent Guidelines for evcc-crowdscience

This document provides guidelines for AI coding agents working in the evcc-crowdscience repository.

## Project Overview

TypeScript monorepo for crowdsourced EV charge controller data collection and visualization.

- **Runtime**: Bun (not Node.js)
- **Language**: TypeScript 5.9.3
- **Architecture**: Monorepo with 2 apps: `web` (dashboard) and `transporter` (MQTT collector)

## Commands

### Root Commands

```bash
bun run dev                  # Start web app in dev mode
bun run lint                 # Lint all files
bun run lint:fix             # Lint and auto-fix issues
bun run format:check         # Check code formatting
bun run format:write         # Format all files
```

### Web App (apps/web/)

```bash
bun run dev                  # Start dev server (Vite)
bun run build                # Build for production
bun run start                # Start production server
bun run typecheck            # Run TypeScript type checking
bun run db:generate          # Generate database migrations
bun run db:migrate           # Run database migrations
bun run db:push              # Push schema changes to database
bun run db:studio            # Open Drizzle Studio (DB GUI)
bun run contract:generate    # Generate oRPC contract for client
```

### Transporter (apps/transporter/)

```bash
bun run dev                  # Run with watch mode
bun run build                # Build for production
bun test                     # Run all tests
bun test --watch             # Run tests in watch mode
bun test src/path/file.test.ts  # Run a single test file
```

## Use Bun, Not Node.js

**IMPORTANT**: This project uses Bun, not Node.js. Always use Bun commands:

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>`
- Bun automatically loads `.env` files (no dotenv needed)

## Code Style

### Import Order (via Prettier)

1. React imports
2. Next.js imports (if applicable)
3. Third-party modules
4. Empty line
5. Internal imports (`~/`)
6. Relative parent imports (`../`)
7. Relative same-level imports (`./`)

### Import Style

- **Prefer inline type imports**: `import { type User } from '~/db/schema'`
- Use `~/` for absolute imports from `src/` directory
- ESLint enforces `@typescript-eslint/consistent-type-imports` with inline style

### TypeScript

- **Strict mode enabled** - all type checks enforced
- Use `type` or `interface` (no preference enforced)
- Prefix unused variables with underscore: `_unusedVar`
- Use Zod 4 for runtime validation
- Database uses UUID v7 for primary keys (time-sortable)

### React (Web App Only)

- React 19 with automatic JSX runtime (no need to import React)
- Use React Compiler (`eslint-plugin-react-compiler`)
- File-based routing with TanStack Router
- Prefer function components with hooks
- Use `useSuspenseQuery` for data fetching in routes
- Component files use PascalCase: `UserDialog.tsx`

### Naming Conventions

- **Files**: kebab-case for utilities, PascalCase for components
- **Variables/Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Constants**: UPPER_SNAKE_CASE for true constants, camelCase otherwise
- **Database columns**: snake_case (Drizzle ORM convention)

### Error Handling

- Use Zod schemas for input validation
- Return typed errors from oRPC procedures
- Database uses soft deletes (`deletedAt` timestamp)
- Check for null/undefined with `isNull()` in Drizzle queries

### Styling

- **Tailwind CSS 4** for all styling
- Use `clsx` and `tailwind-merge` for conditional classes
- shadcn/ui components in `~/components/ui/`
- Follow existing component patterns from shadcn/ui

### Database

- **ORM**: Drizzle ORM with SQLite
- **Migrations**: Generate with `bun run db:generate`, apply with `bun run db:migrate`
- Use prepared statements via Drizzle query builder
- Soft deletes: Filter with `isNull(table.deletedAt)`
- Timestamps: `createdAt`, `updatedAt`, `deletedAt` on all tables

### API Layer (oRPC)

- Type-safe RPC framework with contract generation
- Routers in `~/orpc/[domain]/router.ts`
- Use `authedProcedure` or `adminProcedure` for protected routes
- Define input/output schemas with Zod
- Generate client contract after changes: `bun run contract:generate`

### Testing

- Framework: Bun's built-in test runner (`bun:test`)
- Import: `import { describe, test, expect } from "bun:test"`
- Test files: `*.test.ts` next to source files
- Run single test: `bun test path/to/file.test.ts`
- Use descriptive test names with `test("should do X when Y", ...)`

## File Structure

```
apps/
  web/                        # Web dashboard (React + TanStack Start)
    src/
      routes/                 # File-based routes
        _public/              # Public routes
        dashboard/            # Protected dashboard routes
        api/                  # API routes
      components/
        ui/                   # shadcn/ui components
        charts/               # ECharts wrappers
        dashboard-tiles/      # Dashboard widgets
      orpc/                   # API routers (backend)
        [domain]/router.ts    # Domain-specific routers
      db/
        schema.ts             # Database schema (generated)
        client.ts             # Database connection
      lib/                    # Utility functions
      hooks/                  # React hooks
      middleware/             # oRPC middleware
      jobs/                   # Background cron jobs
  transporter/                # MQTT data collector
    src/
      clients/                # MQTT & InfluxDB clients
      lib/                    # Core logic
```

## Common Patterns

### Creating a New oRPC Route

1. Define schemas in `~/schema/[domain].ts` or inline
2. Create router in `~/orpc/[domain]/router.ts`
3. Export from `~/orpc/router.ts`
4. Run `bun run contract:generate` to update client types
5. Use in components: `orpc.[domain].[method].useQuery()`

### Database Changes

1. Modify `~/db/schema.ts` (edit manually, don't generate)
2. Run `bun run db:generate` to create migration
3. Review migration in `drizzle/` folder
4. Run `bun run db:migrate` to apply
5. Commit both schema and migration files

### Adding a Route

1. Create file in `apps/web/src/routes/[path].tsx`
2. Export `Route = createFileRoute('/path')()`
3. Use `loader` for data prefetching
4. Use `beforeLoad` for auth/context setup
5. Route tree auto-generates on save

## Environment Variables

- Web app: Copy `apps/web/.env.example` to `apps/web/.env`
- Transporter: Copy `apps/transporter/.env.example` to `apps/transporter/.env`
- Use `@t3-oss/env-core` for type-safe env validation in web app
- Bun auto-loads `.env` files (no manual loading needed)

## Common Pitfalls

- Don't use Node.js-specific APIs; use Bun equivalents
- Don't forget to run `bun run contract:generate` after oRPC changes
- Don't modify `routeTree.gen.ts` manually (auto-generated)
- Don't modify `db/schema.ts` with generated migrations (edit manually first)
- Don't use `better-sqlite3` (use Drizzle with `@libsql/client`)
- Don't import React in .tsx files (automatic JSX runtime)
- Filter soft-deleted records: `where(isNull(table.deletedAt))`

## Best Practices

- Keep components small and focused
- Use TanStack Query for server state
- Prefer server-side data fetching in route loaders
- Use Zod schemas for all API inputs/outputs
- Write tests for complex business logic
- Use descriptive variable names
- Document complex algorithms with comments
- Follow existing patterns in the codebase
