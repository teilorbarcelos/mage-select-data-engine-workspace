# Mage Select Engine 🧙‍♂️

[![npm version](https://img.shields.io/npm/v/mage-select-data-engine.svg?style=flat-square)](https://www.npmjs.com/package/mage-select-data-engine)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/teilorbarcelos/mage-select-data-engine-workspace/blob/main/LICENSE)

> **"Built for scale. The engine that makes infinite scroll in selects effortless."**

## 🚨 The Problem: The Scalability Wall

Most select libraries work great with 50 items. But as your application grows (CRUDs, Logs, Large Catalogs), you hit the **Scalability Wall**:
1. **Performance**: Rendering 5,000 items in a dropdown crashes the browser.
2. **Complexity**: Implementing `IntersectionObserver`, pagination state, and search debouncing manually for every select is a nightmare.
3. **Ghost Selections**: On "Edit Mode", when you have a selected ID that isn't in the first page of results, the label disappears.

**Mage Select** handles the heavy lifting of **Dynamic Infinite Lists** while bridging the **ID vs. Object Gap**.

---

## 📦 Ecosystem

| Package | Purpose |
| :--- | :--- |
| **`mage-select-data-engine`** | **Core Engine**. Infinite scroll logic, deduplication & pagination. |
| **`mage-select-data-react`** | **React Adapter**. Hooks for high-performance state sync. |
| **`mage-select-data-rhf`** | **RHF Bridge**. Auto-hydration & seamless Form integration. |

---

## ✨ Key Features

- **🚀 Automated Infinite Scroll**: Manage offset pagination and loading states with zero boilerplate.
- **🔍 High-Performance Search**: Debounced and cache-aware indexing.
- **🔄 Deep Hydration**: Automatically resolves pre-selected IDs into rich objects, even if they aren't on the current page.
- **🛡️ 100% Type-Safe**: Zero `any`. Built with strict TypeScript for senior-level stability.

---

## 🚀 Implementation Guide

<details>
<summary><b>🔥 React Hook Form + Infinite Scroll</b></summary>

```tsx
import { useMageSelectController } from 'mage-select-data-react-hook-form';

function MyUserSelect() {
  const { state, toggleSelection, setSearch, loadMore } = useMageSelectController({
    name: 'userId',
    control,
    // Mage handles the page increments and search terms for you
    fetchPage: async (page, search) => {
      return myApi.get(`/users?page=${page}&q=${search}`);
    },
    fetchByIds: async (ids) => myApi.get(`/users/batch?ids=${ids.join(',')}`),
  });

  return (
    <MySelectView 
      items={state.items}
      hasMore={state.hasMore}
      onLoadMore={loadMore} // Just trigger when the user scrolls!
    />
  );
}
```
</details>

<details>
<summary><b>🖥️ Server-Side (Prisma/Node)</b></summary>
<p>Coordinate pagination on the backend with one utility.</p>

```typescript
import { handlePrismaMageRequest } from 'mage-select-data-engine/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  return handlePrismaMageRequest(prisma.user, searchParams, {
    searchField: 'name'
  });
}
```
</details>

---

## 📄 License & Mission

MIT © [Teilor Barcelos](https://github.com/teilorbarcelos)

Part of the [Mage Select Ecosystem](https://github.com/teilorbarcelos/mage-select-data-engine-workspace).
