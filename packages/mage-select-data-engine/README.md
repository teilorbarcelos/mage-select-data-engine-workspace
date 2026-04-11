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
    return res.json();
  },
  fetchByIds: async (ids) => {
    const res = await fetch(`/api/data/ids?ids=${ids.join(',')}`);
    return res.json();
  },
  getId: (item) => item.id
});

engine.subscribe((state) => {
  console.log('New state:', state);
});

engine.initialLoad();
engine.setSearch('term');
engine.loadMore();
```

## Backend Implementation (Prisma)

The package provides standard utilities for backend implementation using Prisma.

### Listing Items

The `handlePrismaMageRequest` function handles offset pagination, dynamic search, and sorting.

```typescript
import { handlePrismaMageRequest } from 'mage-select-data-engine/server';

app.get('/api/users', async (req, res) => {
  const result = await handlePrismaMageRequest(prisma.user, req.query, {
    pageSize: 20,
    orderBy: { name: 'asc' },
    where: { status: 'ACTIVE' }
  });
  
  res.json(result);
});
```

### Fetching by IDs (Hydration)

The `handlePrismaMageHydration` function resolves a list of IDs into full objects, used for initial hydration.

```typescript
import { handlePrismaMageHydration } from 'mage-select-data-engine/server';

app.get('/api/users/ids', async (req, res) => {
  const items = await handlePrismaMageHydration(prisma.user, req.query);
  
  res.json(items);
});
```

### Request Parameters

The backend utilities automatically interpret the following query parameters:

- `page`: Page number (starting from 1).
- `pageSize`: Number of items per page.
- `search`: Search term.
- `columns`: Comma-separated list of columns to search (e.g., `name,email`).
- `sort`: Column name to sort by.
- `order`: Sort direction (`asc` or `desc`).
- `ids`: Comma-separated IDs for hydration.

## State API

The state (`getState()`) includes:
- `items`: List of currently loaded selectable items.
- `selectedItems`: Full objects of selected items.
- `isLoading`: Current page loading status.
- `isHydrating`: Initial IDs lookup status.
- `search`: Current search term.
- `page`: Current page index.
- `hasMore`: Indicates if more data is available.
