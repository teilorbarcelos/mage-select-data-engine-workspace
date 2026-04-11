# Mage Select Data Engine

A full-stack monorepo for the `mage-select-data-engine`, an asynchronous select engine with infinite scroll and entity hydration.

## 📦 Structure

- `packages/mage-select-data-engine`: Framework-agnostic core data engine logic.
- `packages/mage-select-data-react`: React adapter using subscriptions (optimized renders).
- `packages/mage-select-data-react-hook-form`: Clean integration via `useMageSelectController`.
- `apps/backend`: Node.js Express API mock consuming the database.
- `apps/frontend`: Vite React App with test forms and optimized styling.
- `prisma`: Global SQLite configuration, schema, and seeds.

## 🛠 Getting Started

To start and test the project, follow these commands from the repository root:

### 1. Install dependencies
```bash
npx pnpm install
```

### 2. Prepare Database (SQLite)
Generate tables and populate with 1500+ records via seed script:
```bash
npx pnpm --filter mage-prisma run db:push
npx pnpm --filter mage-prisma run db:seed
```

### 3. Full Build (Optional, but recommended)
To ensure all package `.d.ts` files are correctly linked:
```bash
npx pnpm build
```

### 4. Continuous Development Mode
We configured **TurboRepo** to allow the entire stack to run with a single command with native Hot Reload:

```bash
npx pnpm dev
# or
bun dev
```

This will:
- Run TSUP in watch mode for `packages`.
- Start the backend on port **8888**.
- Start the frontend on port **3000**.

Access [http://localhost:3000](http://localhost:3000).

## 🚀 How the React Adapter works?

The `MageSelect` in this monorepo's frontend demonstrates an optimized **Search-First Combo Box** layout:
- **Search Input**: Located at the top for immediate filtering.
- **Dynamic Chips**: Selected items appear below in a flexible wrapping container.
- **Strict Typing**: No `any` types allowed in the full-stack implementation.
- **RHF Integration**: Full support for validation `rules` and `fieldState`.
