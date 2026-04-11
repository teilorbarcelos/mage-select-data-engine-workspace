# mage-select-data-react ⚛️

[![npm version](https://img.shields.io/npm/v/mage-select-data-react.svg?style=flat-square)](https://www.npmjs.com/package/mage-select-data-react)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/teilorbarcelos/mage-select-data-engine-workspace/blob/main/LICENSE)

React adapter for **Mage Select**. Features high-performance state synchronization using `useSyncExternalStore` to prevent unnecessary re-renders.

## Installation

```bash
pnpm add mage-select-data-react mage-select-data-engine
```

## Usage

The `useMageSelect` hook provides a reactive bridge to the core engine.

```tsx
import { useMageSelect } from 'mage-select-data-react';

function MySelect() {
  const { state, loadMore, setSearch, toggleSelection } = useMageSelect({
    fetchPage: async (page, search) => { /* ... */ },
    fetchByIds: async (ids) => { /* ... */ },
    getId: (item) => item.id
  });

  return (
    <div>
      <input 
        placeholder="Filter..." 
        onChange={(e) => setSearch(e.target.value)} 
      />
      <ul>
        {state.items.map(item => (
          <li key={item.id} onClick={() => toggleSelection(item)}>
            {item.name} {state.selectedItems.includes(item) && '✅'}
          </li>
        ))}
      </ul>
      {state.hasMore && <button onClick={loadMore}>Load more</button>}
    </div>
  );
}
```

## Why use it?

Unlike standard component state, this adapter connects to an external source of truth (the Engine). This allows you to:
- Share the same selection state between multiple components.
- Keep business logic (pagination, indexing) outside the visual layer.
- Achieve maximum performance with granular state subscriptions.

---
Part of the [Mage Select Ecosystem](https://github.com/teilorbarcelos/mage-select-data-engine).
