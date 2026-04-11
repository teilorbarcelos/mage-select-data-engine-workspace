# mage-select-data-react ⚛️

[![npm version](https://img.shields.io/npm/v/mage-select-data-react.svg?style=flat-square)](https://www.npmjs.com/package/mage-select-data-react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/teilorbarcelos/mage-select-data-engine-workspace/blob/main/LICENSE)

React adapter for **Mage Select**. Features high-performance state synchronization for **dynamic infinite scroll selects**.

## 🚀 The Mission

Implementing an infinite-loading select in React is usually a recipe for performance bottlenecks and complex state management. This adapter provides hooks that connect your UI to the **Mage Engine**, handling the "heavy lifting" of pagination and search with `useSyncExternalStore` for surgical performance.

## ✨ Key Features

- **⚡ Performance-First**: Zero re-renders on the parent component during dropdown interaction.
- **🔄 Infinite Scroll Ready**: Simple `loadMore` trigger that works perfectly with `IntersectionObserver`.
- **🔍 Sync-Aware Search**: Real-time search that works in harmony with the current selection.
- **🛠️ Total UI Control**: Headless hooks. You provide the UI, we provide the logic.

## 📦 Installation

```bash
pnpm add mage-select-data-react mage-select-data-engine
```

## 💻 Usage

```tsx
import { useMageSelect } from 'mage-select-data-react';

function MyDynamicSelect() {
  const { state, loadMore, setSearch, toggleSelection } = useMageSelect({
    fetchPage: async (page, search) => {
      // Automatic page management
      return fetch(`/api/data?page=${page}&q=${search}`).then(res => res.json());
    },
    getId: (item) => item.id
  });

  return (
    <div>
       <input onChange={(e) => setSearch(e.target.value)} />
       <div onScroll={(e) => /* trigger loadMore() when near bottom */}>
         {state.items.map(item => <Item key={item.id} data={item} />)}
       </div>
       {state.isLoading && <Spinner />}
    </div>
  );
}
```

---

Part of the [Mage Select Ecosystem](https://github.com/teilorbarcelos/mage-select-data-engine-workspace).
