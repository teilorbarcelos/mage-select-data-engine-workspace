# mage-react-hook-form

High-level integration between `mage-select-data-engine` and `react-hook-form`.

## Installation

```bash
pnpm add mage-react-hook-form mage-react mage-select-data-engine react-hook-form
```

## Usage

The `useMageSelectController` hook abstracts the complexity of synchronizing form values (IDs) with full objects from the engine.

```tsx
import { useMageSelectController } from 'mage-react-hook-form';
import { useForm } from 'react-hook-form';

function MyFormSelect({ control, name, config }) {
  const { 
    field, 
    state, 
    setSearch, 
    loadMore, 
    toggleSelection 
  } = useMageSelectController({
    name,
    control,
    engineOrConfig: config,
    multiple: true
  });

  return (
    <div ref={field.ref}>
      {/* UI Select implementation */}
    </div>
  );
}
```

## Automatic Hydration

This package solves one of the most common issues in asynchronous selects: **editing**.
When `react-hook-form` initializes with `defaultValues` containing IDs, the controller detects that the objects are not in the cache and automatically triggers the engine's `fetchByIds`, ensuring the correct label is displayed without you having to manually fetch data before rendering the form.

## Sync Flow

1. **Form -> Engine**: When the RHF value changes (e.g., form reset), the engine updates its selection.
2. **Engine -> Form**: When a user clicks an item (via `toggleSelection`), the ID is sent to RHF's `field.onChange`.
