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
| **Implementation** | Boilerplate for IntersectionObserver & Debounce. | **Zero boilerplate**. Core engine handles logic. |
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
- **🔍 High-Performance Search**: Debounced and cache-aware indexing.
- **🔄 Smart Hydration**: Automatically fetches missing objects for your initial IDs.
- **🛡️ 100% Type-Safe**: Zero `any`. Built with strict TypeScript for senior-level stability.

---

## 🚀 Implementation Guide

Choose the approach that best fits your project:

<details>
<summary><b>▶ Click to expand: Option 1 - React Hook Form (Recommended)</b></summary>
<br />
<p>Handles form state, validation, and automatic ID-to-Object hydration. Perfect for CRUD applications.</p>

```tsx
import { useMageSelectController } from 'mage-select-data-react-hook-form';

function MyUserSelect() {
  const { state, toggleSelection, setSearch, loadMore } = useMageSelectController({
    name: 'userId',
    control,
    // Mage handles the page increments and search terms for you
    fetchPage: async (page, search) => {
      return myApi.get(`/users?page=${page}&q=${search}`); // { items: T[], hasMore: boolean }
    },
    fetchByIds: async (ids) => myApi.get(`/users/batch?ids=${ids.join(',')}`),
  });

  return (
    <MySelectView 
      items={state.items}
      selectedItems={state.selectedItems}
      hasMore={state.hasMore}
      isLoading={state.isLoading || state.isHydrating}
      onLoadMore={loadMore} 
      onSelect={toggleSelection}
      onSearch={setSearch}
    />
  );
}
```
</details>

<details>
<summary><b>▶ Click to expand: Option 2 - Vanilla React (Total Control)</b></summary>
<br />
<p>Low-level state management for custom UI components without dependency on form libraries.</p>

```tsx
import { useMageSelect } from 'mage-select-data-react';

function CustomSelect() {
  const { state, toggleSelection, setSearch, loadMore } = useMageSelect({
    fetchPage: (p, s) => myApi.list(p, s),
    fetchByIds: (ids) => myApi.getByIds(ids),
    initialSelectedIds: ['123'], // Will hydrate '123' automatically
  });

  return (
    <div>
      <input 
        placeholder="Search..." 
        onChange={(e) => setSearch(e.target.value)} 
      />
      
      <ul className="scrollable-container">
        {state.items.map(item => (
          <li key={item.id} onClick={() => toggleSelection(item)}>
            {item.name} {state.selectedItems.some(i => i.id === item.id) && '✓'}
          </li>
        ))}
        
        {state.hasMore && (
          <button onClick={loadMore} disabled={state.isLoading}>
            {state.isLoading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </ul>
    </div>
  );
}
```
</details>

<details>
<summary><b>▶ Click to expand: Option 3 - Server-Side (Node/Prisma)</b></summary>
<br />
<p>Coordinate pagination and search on the backend with one utility.</p>

```typescript
import { handlePrismaMageRequest } from 'mage-select-data-engine/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  // Handles pagination and search parameters across multiple fields automatically
  return handlePrismaMageRequest(prisma.user, searchParams, {
    searchFields: ['name', 'email'], // Multiple fields support!
    include: { profile: true }
  });
}
```
</details>

---

## 📄 License & Mission

MIT © [Teilor Barcelos](https://github.com/teilorbarcelos)

Part of the [Mage Select Ecosystem](https://github.com/teilorbarcelos/mage-select-data-engine-workspace).
