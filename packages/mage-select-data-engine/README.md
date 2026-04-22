# Mage Select Engine 🧙‍♂️

[![npm version](https://img.shields.io/npm/v/mage-select-data-engine.svg?style=flat-square)](https://www.npmjs.com/package/mage-select-data-engine)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/teilorbarcelos/mage-select-data-engine-workspace/blob/main/LICENSE)

> **"Stop loading 500+ items in your selects. Save your backend and your users' RAM."**

## 🚨 The Scalability Debt

In many applications, Select components start simple. But as your data grows (CRUDs, Large Catalogs, Logs), you hit a technological debt:
- **Client-Side Exhaustion**: Rendering thousands of items freezes the browser and drains battery.
- **Backend Latency**: Fetching massive lists for every dropdown interaction slows down your database.
- **Data Degradation**: In "Edit Mode", a select often loses its label because the current ID isn't in the first page of results, leading to "ghost" values.

**Mage Select** is an entity-aware engine that eliminates this debt by managing **Dynamic Infinite Scrolling** and **Automatic Hydration** at the architectural level.

---

## ⚖️ Without vs. With Mage Select

| Challenge | Without Mage Select | With Mage Select |
| :--- | :--- | :--- |
| **Data Volume** | Browser memory leaks with large datasets. | **Virtualized logic**. Only active pages are in memory. |
| **Edit Mode** | "Empty labels" for IDs out of the initial list. | **Auto-Hydration**. Rich data is always present. |
| **Lifecycle** | Messy `useEffect` hooks for init and sync. | **Zero Effects**. Purely declarative initialization. |
| **Backend Health** | Heavy queries for full lists. | **Surgical queries** via offset pagination. |

---

## 📦 Ecosystem

| Package | Purpose |
| :--- | :--- |
| **`mage-select-data-engine`** | **Core Engine**. Infinite scroll logic, deduplication & pagination. |
| **`mage-select-data-react`** | **React Adapter**. Hooks for high-performance state sync. |
| **`mage-select-data-react-hook-form`** | **RHF Bridge**. Auto-hydration & seamless Form integration. |

---

## ✨ Key Features

- **🚀 Automated Infinite Scroll**: Manage offset pagination and loading states with zero boilerplate.
- **🔄 Zero-Effect Hydration**: Pass `initialSelectedIds` to the engine and it handles the rest. No `useEffect` required.
- **🔄 Bi-Directional Loading**: Advanced support for "up and down" infinite scrolling with automatic memory management (Rechargeable).
- **🔍 High-Performance Search**: Debounced and cache-aware indexing.
- **🛡️ 100% Type-Safe**: Zero `any`. Built with strict TypeScript for senior-level stability.

---

## 🚀 Implementation Guide

### 1. React Hook Form (Recommended)
Handles form state, validation, and automatic ID-to-Object hydration. Perfect for CRUD applications.

```tsx
import { useMageSelectController } from 'mage-select-data-react-hook-form';

function MyUserSelect({ control }) {
  const { state, toggleSelection, setSearch, loadMore } = useMageSelectController({
    name: 'userId',
    control,
    autoInitialLoad: true, // No useEffect required for mounting!
    fetchPage: async (page, search, options) => {
      const fields = options.searchFields?.join(',') || 'name';
      return myApi.get(`/users?page=${page}&q=${search}&fields=${fields}`); 
    },
    fetchByIds: async (ids) => myApi.get(`/users/batch?ids=${ids.join(',')}`),
    searchFields: ['name'],
  });

  return (
    <div className="select-dropdown">
       <input value={state.search} onChange={(e) => setSearch(e.target.value)} />
       <ul>
         {state.items.map(user => (
           <li key={user.id} onClick={() => toggleSelection(user)}>
             {user.name}
           </li>
         ))}
       </ul>
    </div>
  );
}
```

### 2. Vanilla React / Headless
Low-level state management for custom UI components.

```tsx
import { useMageSelect } from 'mage-select-data-react';

function CustomSelect() {
  const { state, toggleSelection, setSearch, loadMore } = useMageSelect({
    fetchPage: (p, s) => myApi.list(p, s),
    fetchByIds: (ids) => myApi.getByIds(ids),
    initialSelectedIds: ['123'], // Engine hydrates '123' automatically on init
  }, {
    autoInitialLoad: true,
  });

  // ... render items from state.items
}
```

### 3. Bi-Directional Infinite Scroll (The "Mage Pattern")
Advanced support for massive lists. To avoid scroll jumps when items are added/removed, use the **Anchor Pattern**:

```tsx
function BiDirectionalList() {
  const listRef = useRef<HTMLUListElement>(null);
  const anchorRef = useRef<{ id: string; offsetTop: number } | null>(null);
  const { state, loadMore, loadPrevious } = useMageSelect({ ... }, { autoInitialLoad: true });

  useLayoutEffect(() => {
    if (anchorRef.current && listRef.current) {
      const node = listRef.current.querySelector(`[data-id="${anchorRef.current.id}"]`) as HTMLElement;
      if (node) {
        const diff = node.offsetTop - anchorRef.current.offsetTop;
        listRef.current.scrollTop += diff;
      }
      anchorRef.current = null;
    }
  }, [state.items]);

  const handleScroll = (e) => {
    const list = e.currentTarget;
    if (state.isLoading) return;

    if (list.scrollTop <= 50 && state.hasPrevious) {
      const first = Array.from(list.children).find(c => (c as HTMLElement).offsetTop >= list.scrollTop) as HTMLElement;
      if (first) anchorRef.current = { id: first.dataset.id!, offsetTop: first.offsetTop };
      loadPrevious();
    } else if (list.scrollHeight - list.scrollTop <= list.clientHeight + 50 && state.hasMore) {
      const first = Array.from(list.children).find(c => (c as HTMLElement).offsetTop >= list.scrollTop) as HTMLElement;
      if (first) anchorRef.current = { id: first.dataset.id!, offsetTop: first.offsetTop };
      loadMore();
    }
  };

  return <ul ref={listRef} onScroll={handleScroll}>...</ul>;
}
```

---

## 🛠 Configuration Reference

### Engine Config Props

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `startPage` | `number` | `1` | The starting page index. |
| `searchFields` | `string[]` | `[]` | List of fields to be searched by the backend. |
| `biDirectionalRechargeable` | `boolean` | `false` | Enables memory management for bidirectional lists. |
| `initialSelectedIds` | `string[]` | `[]` | **No Effect needed**. IDs to be hydrated immediately on creation. |
| `cacheLimit` | `number` | `undefined` | Maximum number of items to keep in the lookup cache. |

---

## 📡 Server Helpers

### Server-Side (Prisma Integration)
If you are using Prisma, you can use our server helper to coordinate pagination and search with one utility.

```typescript
import { handlePrismaMageRequest } from 'mage-select-data-engine/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  return handlePrismaMageRequest(prisma.user, searchParams, {
    searchFields: ['name', 'email'],
    startPage: 0,
    mappings: {
      search: 'q',
      columns: 'fields',
      pageSize: 'size'
    }
  });
}
```

---

## 📄 License & Mission

MIT © [Teilor Barcelos](https://github.com/teilorbarcelos)

Part of the [Mage Select Ecosystem](https://github.com/teilorbarcelos/mage-select-data-engine-workspace).
