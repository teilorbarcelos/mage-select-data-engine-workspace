# Mage Select Engine 🧙‍♂️

[![npm version](https://img.shields.io/npm/v/mage-select-data-engine.svg?style=flat-square)](https://www.npmjs.com/package/mage-select-data-engine)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/teilorbarcelos/mage-select-data-engine-workspace/blob/main/LICENSE)

> **"An entity-aware infinite select engine. Solving the gap between IDs and rich data."**

## 🚨 The Problem

Most select components (and developers) treat data as simple lists. But in production, you face the **ID vs. Object Gap**:
1. Your database uses **IDs**.
2. Your UI needs **Objects** (Labels, Icons, Metadata).
3. On "Edit Mode", you only have IDs, leading to **empty labels** until the user searches.

**Mage Select** bridges this gap by managing pagination, search, and **automatic entity hydration**.

---

## 📦 Ecosystem

| Package | Purpose | Installation |
| :--- | :--- | :--- |
| **`mage-select-data-engine`** | **Core Engine**. Logic, cache & pagination. | `pnpm add mage-select-data-engine` |
| **`mage-select-data-react`** | **React Adapter**. Hooks for state sync. | `pnpm add mage-select-data-react` |
| **`mage-select-data-rhf`** | **RHF Bridge**. Auto-hydration & Form state. | `pnpm add mage-select-data-react-hook-form` |

---

## 🚀 Implementation Guide

Choose the approach that best fits your project:

<details>
<summary><b>🔥 Option 1: React Hook Form (Recommended)</b></summary>
<p>
Best for productivity. Handles form state, validation, and automatic ID-to-Object hydration.
</p>

```tsx
import { useMageSelectController } from 'mage-select-data-react-hook-form';
import { useForm } from 'react-hook-form';

function MyForm() {
  const { control } = useForm({
    defaultValues: {
      userIds: ['user-123'] // Mage will fetch 'user-123' data automatically
    }
  });

  const { state, toggleSelection, setSearch, loadMore } = useMageSelectController({
    name: 'userIds',
    control,
    fetchPage: async (p, s) => fetchUsers(p, s),
    fetchByIds: async (ids) => fetchUsersByIds(ids),
  });

  return (
    <MySelectView 
      state={state} 
      onSearch={setSearch} 
      onLoadMore={loadMore}
      onSelect={toggleSelection}
    />
  );
}
```
</details>

<details>
<summary><b>⚛️ Option 2: Vanilla React (Manual Control)</b></summary>
<p>
Core logic for custom state management without form libraries.
</p>

```tsx
import { useMageSelect } from 'mage-select-data-react';

function SimpleSelect() {
  const { state, toggleSelection, setSearch, loadMore } = useMageSelect({
    fetchPage: async (p, s) => fetchItems(p, s),
    fetchByIds: async (ids) => fetchByIds(ids),
    initialSelectedIds: ['1'],
  });

  return (
    <div>
      <input onChange={(e) => setSearch(e.target.value)} />
      <ul>
        {state.items.map(item => (
          <li key={item.id} onClick={() => toggleSelection(item)}>
            {item.name} {state.selectedItems.includes(item) && '✅'}
          </li>
        ))}
      </ul>
      {state.hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```
</details>

<details>
<summary><b>🖥️ Option 3: Server-Side (Node/Prisma)</b></summary>
<p>
Zero-boilerplate backend integration.
</p>

```typescript
import { handlePrismaMageRequest } from 'mage-select-data-engine/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  return handlePrismaMageRequest(prisma.user, searchParams, {
    searchField: 'name',
    include: { profile: true },
    orderBy: { createdAt: 'desc' }
  });
}
```
</details>

---

## ✨ Why Mage Select?

- **🚀 Headless**: No CSS, no UI components. Plug it into Radix, Headless UI, or your own styles.
- **🔄 Smart Hydration**: Automatically fecthes missing objects for your initial IDs.
- **🔍 State-Aware Search**: Debounced and cache-aware search that doesn't reset your selection.
- **🛡️ 100% Type-Safe**: Built with strict TypeScript. Zero `any`.

## 📄 License

MIT © [Teilor Barcelos](https://github.com/teilorbarcelos)
