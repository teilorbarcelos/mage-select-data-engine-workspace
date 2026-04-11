# mage-select-data-react-hook-form 📋

[![npm version](https://img.shields.io/npm/v/mage-select-data-react-hook-form.svg?style=flat-square)](https://www.npmjs.com/package/mage-select-data-react-hook-form)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/teilorbarcelos/mage-select-data-engine-workspace/blob/main/LICENSE)

High-level integration between **Mage Select** and **React Hook Form**. Built for complex, data-heavy forms.

## 🚀 The Mission: Dynamic Form Scalability

In large-scale applications, your forms often contain selects with thousands of records. Standard integrations fail because they only hold the "current value" as an ID, losing labels and context when the data isn't pre-loaded.

This bridge solves this by combining **Infinite Scroll** with **Entity Hydration**. It ensures your form state is always synchronized with rich object data, even if the selected item is buried deep in a paginated list.

## ✨ Key Features

- **✅ Effortless Integration**: Connect the Mage Engine to any RHF `control` in seconds.
- **🔄 Auto-Hydration**: Edit mode just works. Pass the IDs, and Mage fetches the entities automatically.
- **📄 Infinite Scroll Support**: Native pagination state that flows perfectly into your form UI.
- **🛡️ Validation-Ready**: Fully compatible with RHF validation rules and error handling.

## 📦 Installation

```bash
pnpm add mage-select-data-react-hook-form mage-select-data-react mage-select-data-engine
```

## 💻 Usage

```tsx
import { useForm } from 'react-hook-form';
import { useMageSelectController } from 'mage-select-data-react-hook-form';

function UserEditForm() {
  const { control } = useForm({
    defaultValues: { selectedUserId: 'user_999' } // Deep ID in an infinite list
  });

  const { state, loadMore, toggleSelection } = useMageSelectController({
    name: 'selectedUserId',
    control,
    // Mage handles the "Hydration" of 'user_999' automatically!
    fetchByIds: (ids) => api.getUsers(ids),
    fetchPage: (page, search) => api.listUsers(page, search),
  });

  return (
    <MyInfiniteSelectView 
      items={state.items}
      onLoadMore={loadMore}
      selectedItems={state.selectedItems} // Contains the full object for 'user_999'
      onSelect={toggleSelection}
      isLoading={state.isHydrating || state.isLoading}
    />
  );
}
```

---

Part of the [Mage Select Ecosystem](https://github.com/teilorbarcelos/mage-select-data-engine-workspace).
