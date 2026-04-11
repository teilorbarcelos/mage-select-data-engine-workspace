# mage-select-data-react-hook-form 📋

[![npm version](https://img.shields.io/npm/v/mage-select-data-react-hook-form.svg?style=flat-square)](https://www.npmjs.com/package/mage-select-data-react-hook-form)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/teilorbarcelos/mage-select-data-engine-workspace-workspace/blob/main/LICENSE)

High-level integration between **Mage Select** and **React Hook Form**.

## Installation

```bash
pnpm add mage-select-data-react-hook-form mage-select-data-react mage-select-data-engine react-hook-form
```

## Usage

The `useMageSelectController` hook abstracts the complexity of synchronizing form state with the asynchronous Data Engine.

```tsx
import { useMageSelectController } from 'mage-select-data-react-hook-form';
import { useForm } from 'react-hook-form';

function MyFormSelect({ control, name, config }) {
  const { 
    field, 
    fieldState,
    state, 
    setSearch, 
    loadMore, 
    toggleSelection 
  } = useMageSelectController({
    name,
    control,
    engineOrConfig: config,
    multiple: true,
    valueType: 'id', // 'id' (default) or 'object'
    rules: { required: 'Please select at least one item' }
  });

  return (
    <div className={fieldState.invalid ? 'is-invalid' : ''}>
      <input 
        placeholder="Type to search..." 
        onChange={(e) => setSearch(e.target.value)} 
      />
      {fieldState.error && <p>{fieldState.error.message}</p>}
      
      {/* Render your list using state.items and toggleSelection */}
    </div>
  );
}
```

## Advanced Features

### 🔄 Automatic Hydration
Mage solves the "asynchronous edit" problem. If your form initializes with IDs, the controller identifies missing objects in the cache and automatically triggers `fetchByIds`, ensuring your UI handles initial data perfectly.

### 🎯 Value Type Control
- **`id` (Default)**: Form persists only the entity IDs.
- **`object`**: Form persists the entire JSON object.

### 🛡️ Built-in Validation
Supports all standard RHF `rules` (required, validate, etc.), seamlessly integrated with the engine's loading states.

---
Part of the [Mage Select Ecosystem](https://github.com/teilorbarcelos/mage-select-data-engine-workspace).
