# mage-select-data-engine

Framework-agnostic data engine for select components featuring offset pagination, dynamic search, and entity hydration.

## Features

- **Offset Pagination**: Full control over pages (`page`) and page size.
- **Integrated Search**: Support for search terms with automatic state reset.
- **Internal Cache**: Entity management to prevent duplicate requests.
- **Framework Agnostic**: Can be used with any framework or vanilla JS.
- **Hydration**: Automatically resolves initial IDs into full objects.

## Installation

```bash
pnpm add mage-select-data-engine
```

## Basic Usage

```typescript
import { MageSelectEngine } from 'mage-select-data-engine';

const engine = new MageSelectEngine({
  fetchPage: async (page, search) => {
    const res = await fetch(`/api/data?page=${page}&search=${search}`);
    return res.json(); // { items: T[], hasMore: boolean }
  },
  fetchByIds: async (ids) => {
    const res = await fetch(`/api/data/ids?ids=${ids.join(',')}`);
    return res.json(); // T[]
  },
  getId: (item) => item.id
});

// Subscribe to changes
engine.subscribe((state) => {
  console.log('New state:', state);
});

// Actions
engine.initialLoad();
engine.setSearch('term');
engine.loadMore();
```

## State API

The state (`getState()`) includes:
- `items`: List of currently loaded selectable items.
- `selectedItems`: Full objects of selected items.
- `isLoading`: Current page loading status.
- `isHydrating`: Initial IDs lookup status.
- `search`: Current search term.
- `page`: Current page index.
- `hasMore`: Indicates if more data is available.
