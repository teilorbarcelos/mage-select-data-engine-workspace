# mage-select-data-react-hook-form 🎣

[![npm version](https://img.shields.io/npm/v/mage-select-data-react-hook-form.svg?style=flat-square)](https://www.npmjs.com/package/mage-select-data-react-hook-form)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/teilorbarcelos/mage-select-data-engine-workspace/blob/main/LICENSE)
[![demo](https://img.shields.io/badge/demo-live-green.svg?style=flat-square)](https://teilorbarcelos.github.io/mage-select-data-engine-demo/)

The professional bridge between **Mage Select** and **React Hook Form**. Optimized for large-scale enterprise forms.

## 😩 The Pain: "Ghost Values" in Edit Mode
We've all been there: you open an Edit Form, the RHF value is `userId: "999"`, but your select only loaded the first 10 users. Result? The select shows a raw ID or stays empty because "User 999" isn't in the list yet.

**Mage Select RHF** solves this with **Automatic Hydration**:
1. RHF sets the initial value ("999").
2. Mage detects it's missing from the current list.
3. Mage calls your `fetchByIds(["999"])` automatically.
4. Your UI renders the correct label ("John Doe") instantly. **No `useEffect` required.**

---

## 🚀 Key Benefits: "Zero Effect" CRUDs

- **Declarative Initialization**: Use `autoInitialLoad: true` to skip manual mounting effects.
- **Bi-Directional Support**: Full memory management for massive multi-selects.
- **Type-Safe Form Values**: Seamlessly integrates with RHF's `control` and `name` types.

---

## 💻 Usage (Standard Example)

```tsx
import { useMageSelectController } from 'mage-select-data-react-hook-form';

function UserSelect({ control }) {
  const { 
    state, 
    loadMore, 
    toggleSelection, 
    setSearch,
    field 
  } = useMageSelectController({
    name: 'userId',
    control,
    autoInitialLoad: true,
    valueType: 'id',
    fetchPage: (p, s) => api.users.list(p, s),
    fetchByIds: (ids) => api.users.getBatch(ids),
    getId: (u) => u.id
  });

  return (
    <div className="mage-container">
      {/* Search Input */}
      <input 
        value={state.search} 
        onChange={(e) => setSearch(e.target.value)} 
        placeholder="Search users..."
      />

      {/* Selected Items Display */}
      <div className="selected-tags">
        {state.selectedItems.map(user => (
          <span key={user.id} className="chip">
            {user.name} 
            <button onClick={() => toggleSelection(user)}>&times;</button>
          </span>
        ))}
      </div>
      
      {/* Infinite List */}
      <ul className="select-list" onScroll={(e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollTop + clientHeight >= scrollHeight - 50 && state.hasMore) {
          loadMore();
        }
      }}>
        {state.items.map(user => (
          <li 
            key={user.id} 
            onClick={() => toggleSelection(user)}
            className={state.selectedItems.some(i => i.id === user.id) ? 'active' : ''}
          >
            {user.name}
          </li>
        ))}
        {state.isLoading && <li className="loading">Loading more...</li>}
      </ul>
    </div>
  );
}
```

---

## ↔️ Bi-Directional Form (The "Mage Pattern")

The complete, production-ready implementation for massive lists with memory recycling.

```tsx
import React, { useRef, useLayoutEffect } from 'react';
import { useMageSelectController } from 'mage-select-data-react-hook-form';

function MassiveTagSelect({ control }) {
  const listRef = useRef<HTMLUListElement>(null);
  const anchorRef = useRef<{ id: string, offsetTop: number } | null>(null);

  const { state, loadMore, loadPrevious, toggleSelection } = useMageSelectController({
    name: 'tags',
    control,
    biDirectionalRechargeable: true, // Crucial for memory safety
    autoInitialLoad: true,
    fetchPage: (p) => api.tags.list(p),
    fetchByIds: (ids) => api.tags.getBatch(ids),
    getId: (t) => t.id
  });

  // 1. ANCHORING: Keeps items in place after top/bottom recycling
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

    // 2. TRIGGER: Capture visible anchor before loading next/prev page
    if (list.scrollTop <= 50 && state.hasPrevious) {
      const first = Array.from(list.children).find(c => (c as HTMLElement).offsetTop >= list.scrollTop);
      if (first) {
        anchorRef.current = { 
          id: (first as HTMLElement).dataset.id!, 
          offsetTop: (first as HTMLElement).offsetTop 
        };
      }
      loadPrevious();
    } else if (list.scrollHeight - list.scrollTop <= list.clientHeight + 50 && state.hasMore) {
      const first = Array.from(list.children).find(c => (c as HTMLElement).offsetTop >= list.scrollTop);
      if (first) {
        anchorRef.current = { 
          id: (first as HTMLElement).dataset.id!, 
          offsetTop: (first as HTMLElement).offsetTop 
        };
      }
      loadMore();
    }
  };

  return (
    <div className="mage-wrapper">
      <ul className="mage-list" ref={listRef} onScroll={handleScroll} style={{ height: '400px', overflow: 'auto' }}>
        {state.hasPrevious && <li className="loader">Loading previous...</li>}
        
        {state.items.map(tag => (
          <li 
            key={tag.id} 
            data-id={tag.id} // REQUIRED for anchoring logic
            onClick={() => toggleSelection(tag)}
            className={state.selectedItems.some(i => i.id === tag.id) ? 'selected' : ''}
          >
            {tag.name}
          </li>
        ))}

        {state.hasMore && <li className="loader">Loading more...</li>}
      </ul>
    </div>
  );
}
```

---

## 🛠 Controller Options

Extends all standard `MageSelectEngineConfig` properties plus:

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Required** | The RHF field name. |
| `control` | `Control` | **Required** | The RHF control object. |
| `valueType` | `'id' \| 'object'` | `'id'` | Determines if the form stores raw IDs or full objects. |
| `autoInitialLoad` | `boolean` | `false` | Automatically triggers the first fetch on mount. |
| `defaultValue` | `T` | `undefined` | Initial value for the field. |

---

Part of the [Mage Select Ecosystem](https://github.com/teilorbarcelos)
