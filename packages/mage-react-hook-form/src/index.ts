import { useController, useFormContext, Control, FieldValues, Path } from 'react-hook-form';
import { useEffect, useMemo, useRef } from 'react';
import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';
import { useMageSelect } from 'mage-react';

import { ControllerRenderProps, ControllerFieldState } from 'react-hook-form';

export interface UseMageSelectControllerProps<T, TFieldValues extends FieldValues, TName extends Path<TFieldValues>> {
  name: TName;
  control?: Control<TFieldValues>;
  engineOrConfig: MageSelectEngine<T> | MageSelectEngineConfig<T>;
  multiple?: boolean;
}

export interface UseMageSelectControllerReturn<T, TFieldValues extends FieldValues, TName extends Path<TFieldValues>> {
  state: ReturnType<typeof useMageSelect<T>>['state'];
  engine: MageSelectEngine<T>;
  loadMore: () => Promise<void>;
  setSearch: (term: string) => Promise<void>;
  toggleSelection: (item: T) => void;
  setValue: (ids: string[]) => Promise<void>;
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
}

export function useMageSelectController<T, TFieldValues extends FieldValues, TName extends Path<TFieldValues>>(
  props: UseMageSelectControllerProps<T, TFieldValues, TName>
): UseMageSelectControllerReturn<T, TFieldValues, TName> {
  const { name, control, engineOrConfig, multiple = false } = props;
  
  const {
    field: { value, onChange, onBlur, ref },
    fieldState
  } = useController({
    name,
    control,
  });

  const engineHook = useMageSelect(engineOrConfig);
  const { engine, state } = engineHook;

  // Hydration ref to prevent infinite loops during array syncs
  const isHydratingRef = useRef(false);

  // Sync Form Value -> Engine State (Hydration on Mount or programmatic change)
  useEffect(() => {
    if (value === undefined || value === null || value === '') {
       engine.setValue([]);
       return;
    }

    const valueArray = Array.isArray(value) ? value : [value];
    const currentSelectedIds = state.selectedItems.map(engine['config'].getId);
    
    // Naive check to see if we need hydration (if external form value doesn't match internal items)
    // A strict implementation would do deep equal, but for IDs this is sufficient
    const needsHydration = JSON.stringify(valueArray) !== JSON.stringify(currentSelectedIds);

    if (needsHydration && !isHydratingRef.current) {
      isHydratingRef.current = true;
      engine.setValue(valueArray).finally(() => {
        isHydratingRef.current = false;
      });
    }
  }, [value, engine]);

  // Sync Engine State -> Form Value
  useEffect(() => {
    // Allow hydration to finish before syncing backward
    if (state.isHydrating || isHydratingRef.current) return;

    const selectedIds = state.selectedItems.map(item => engine['config'].getId(item));
    
    // Only update if changed
    const currentFormArray = Array.isArray(value) ? value : (value !== undefined && value !== null ? [value] : []);
    const changed = JSON.stringify(selectedIds) !== JSON.stringify(currentFormArray);

    if (changed) {
      if (multiple) {
        onChange(selectedIds);
      } else {
        onChange(selectedIds.length > 0 ? selectedIds[0] : null);
      }
    }
  }, [state.selectedItems, multiple, onChange]);

  return {
    state,
    engine,
    loadMore: engineHook.loadMore,
    setSearch: engineHook.setSearch,
    toggleSelection: engineHook.toggleSelection,
    setValue: engineHook.setValue,
    field: { name, value, onChange, onBlur, ref: ref as any },
    fieldState,
  };
}
