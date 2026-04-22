# mage-select-data-react ⚛️

[![npm version](https://img.shields.io/npm/v/mage-select-data-react.svg?style=flat-square)](https://www.npmjs.com/package/mage-select-data-react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/teilorbarcelos/mage-select-data-engine-workspace/blob/main/LICENSE)
[![demo](https://img.shields.io/badge/demo-live-green.svg?style=flat-square)](https://teilorbarcelos.github.io/mage-select-data-engine-demo/)

React adapter for **Mage Select**. Features high-performance state synchronization for **dynamic infinite scroll selects**.

## 🚀 The Mission: "Zero Effect" Architecture

Implementing an infinite-loading select in React is usually a recipe for performance bottlenecks and `useEffect` spaghetti. This adapter eliminates that by providing a **fully declarative API**:

- **No `useEffect` for Data Fetching**: Use `autoInitialLoad` to trigger the first page on mount.
- **No `useEffect` for Hydration**: Pass `initialSelectedIds` and the engine handles the async loading.
- **No `useEffect` for Click Listeners**: Use the recommended `Backdrop` pattern for a pure declarative UI.

## ✨ Key Features

- **⚡ Performance-First**: Uses `useSyncExternalStore` for surgical updates. Zero parent re-renders.
- **🔄 Infinite Scroll Ready**: Simple `loadMore` trigger that works perfectly with standard scroll events or `IntersectionObserver`.
- **🛡️ 100% Type-Safe**: Comprehensive generics support for your custom data types.

## 📦 Installation

```bash
pnpm add mage-select-data-react mage-select-data-engine
```

## 💻 Usage (The Modern Way)

```tsx
import { useMageSelect } from 'mage-select-data-react';

function MyDynamicSelect() {
  const { state, loadMore, setSearch, toggleSelection } = useMageSelect({
    fetchPage: (p, s) => api.fetch(p, s),
    getId: (item) => item.id,
    initialSelectedIds: ['user_123'] // Hydrates automatically!
  }, {
    autoInitialLoad: true, // No useEffect needed!
  });

  return (
    <div>
       <input value={state.search} onChange={(e) => setSearch(e.target.value)} />
       <ul onScroll={(e) => {
         const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
         if (scrollTop + clientHeight >= scrollHeight - 50) loadMore();
       }}>
         {state.items.map(item => (
           <li key={item.id} onClick={() => toggleSelection(item)}>
             {item.name}
           </li>
         ))}
       </ul>
    </div>
  );
}
```

## ↔️ Bi-Directional Infinite Scroll (The "Mage Pattern")

To avoid scroll jumps and infinite loops when items are added/removed from memory, use the **Anchor Pattern**:

```tsx
function BiDirectionalSelect() {
  const listRef = useRef<HTMLUListElement>(null);
  const anchorRef = useRef<{ id: string; offsetTop: number } | null>(null);

  const { state, loadMore, loadPrevious } = useMageSelect({
    fetchPage: (p) => api.list(p),
    biDirectionalRechargeable: true,
  }, { autoInitialLoad: true });

  // 1. ANCHORING: Adjust scroll after DOM updates to keep viewport stable
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

  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const list = e.currentTarget;
    if (state.isLoading) return;

    // 2. TRIGGER: Mark anchor BEFORE loading to prevent "cascades"
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

  return (
    <ul ref={listRef} onScroll={handleScroll}>
      {state.items.map(item => (
        <li key={item.id} data-id={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

## 🛠 Adapter Options

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `autoInitialLoad` | `boolean` | `false` | **Eliminates useEffect**. Automatically triggers the first fetch on mount. |
| `onSelectionChange` | `(items: T[]) => void` | `undefined` | Decoupled callback for selection side-effects. |

---

Part of the [Mage Select Ecosystem](https://github.com/teilorbarcelos)
