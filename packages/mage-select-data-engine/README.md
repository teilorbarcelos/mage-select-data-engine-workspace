# Mage Select Engine 🧙‍♂️

[![npm version](https://img.shields.io/npm/v/mage-select-data-engine.svg?style=flat-square)](https://www.npmjs.com/package/mage-select-data-engine)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/teilorbarcelos/mage-select-data-engine-workspace-workspace/blob/main/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://makeapullrequest.com)

**Mage Select** is a suite of professional packages for building robust, high-performance select components. It solves the most complex parts of data-fetching: pagination, search indexing, state management, and entity hydration.

## 📦 The Ecosystem

Mage is modular. Choose the level of abstraction that fits your project:

| Package | Purpose | Installation |
| :--- | :--- | :--- |
| **`mage-select-data-engine`** | **Core Engine**. Framework-agnostic logic, cache & pagination. | `pnpm add mage-select-data-engine` |
| **`mage-select-data-react`** | **React Adapter**. Hooks for high-performance state sync. | `pnpm add mage-select-data-react` |
| **`mage-select-data-react-hook-form`** | **RHF Bridge**. High-level controller with auto-hydration. | `pnpm add mage-select-data-react-hook-form` |

---

## ✨ Features

- **🚀 Headless & Agnostic**: The core engine doesn't care about your UI components.
- **🔄 Smart Hydration**: Automatically resolves initial IDs into full objects. No more "ID-only" flashes.
- **🔍 Integrated Search**: Debounced search with automatic state reset and cache-aware indexing.
- **📄 Offset Pagination**: Native support for "Load More" patterns with zero boilerplate.
- **🛡️ Type-Safe Backend**: Optimized Prisma utilities for Node.js backends.

---

## 🚀 Quick Start (React + Hook Form)

The recommended way to use Mage in React projects is via the **React Hook Form** integration.

```tsx
import { useMageSelectController } from 'mage-select-data-react-hook-form';

function UserSelect({ control }) {
  const { field, state, setSearch, loadMore } = useMageSelectController({
    name: 'userIds',
    control,
    multiple: true,
    engineOrConfig: {
      fetchPage: (page, search) => fetch(`/api/users?page=${page}&search=${search}`).then(r => r.json()),
      fetchByIds: (ids) => fetch(`/api/users/ids?ids=${ids.join(',')}`).then(r => r.json()),
      getId: (u) => u.id
    }
  });

  return (
    <div>
      <input 
        placeholder="Search..." 
        onChange={(e) => setSearch(e.target.value)} 
      />
      <ul>
        {state.items.map(user => (
          <li key={user.id} onClick={() => field.onChange([...field.value, user.id])}>
            {user.name}
          </li>
        ))}
      </ul>
      {state.hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

---

## 🛠️ Backend Utilities (Prisma)

Mage includes production-ready server utilities to handle complex queries:

```typescript
import { handlePrismaMageRequest } from 'mage-select-data-engine/server';

// In your Express/Fastify route
app.get('/api/users', async (req, res) => {
  const data = await handlePrismaMageRequest(prisma.user, req.query, {
    pageSize: 20,
    orderBy: { name: 'asc' }
  });
  res.json(data);
});
```

---

## 📚 Documentation

Detailed documentation for each package can be found in their respective directories:

- [`mage-select-data-react`](./packages/mage-select-data-react/README.md) - Hooks and React State management.
- [`mage-select-data-react-hook-form`](./packages/mage-select-data-react-hook-form/README.md) - Form integration.
- [`mage-select-data-engine`](./packages/mage-select-data-engine/README.md) - Core API and Server utilities.

## 📄 License

MIT © [Teilor Barcelos](https://github.com/teilorbarcelos)
