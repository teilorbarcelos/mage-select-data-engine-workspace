# mage-react

React adapter for `mage-select-data-engine`. Uses `useSyncExternalStore` to ensure performance and prevent unnecessary re-renders.

## Installation

```bash
pnpm add mage-react mage-select-data-engine
```

## Usage

The `useMageSelect` hook accepts either a configuration object or an existing engine instance.

```tsx
import { useMageSelect } from 'mage-react';

function MySelect() {
  const { state, loadMore, setSearch, toggleSelection } = useMageSelect({
    fetchPage: async (page, search) => { /* ... */ },
    fetchByIds: async (ids) => { /* ... */ },
    getId: (item) => item.id
  });

  return (
    <div>
      <input onChange={(e) => setSearch(e.target.value)} />
      <ul>
        {state.items.map(item => (
          <li key={item.id} onClick={() => toggleSelection(item)}>
            {item.name}
          </li>
        ))}
      </ul>
      {state.hasMore && <button onClick={loadMore}>Load more</button>}
    </div>
  );
}
```

## Why use it?

Unlike common state hooks, this adapter connects to an external source of truth (the Engine), allowing you to share the same state between multiple components if needed, keeping business logic outside the visual layer.
