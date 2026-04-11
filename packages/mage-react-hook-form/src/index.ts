import { useMageSelect } from 'mage-react';
import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';
import { useEffect, useRef } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';

import { ControllerFieldState, ControllerRenderProps } from 'react-hook-form';

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

  const isHydratingRef = useRef(false);

  useEffect(() => {
    if (value === undefined || value === null || value === '') {
       engine.setValue([]);
       return;
    }

    const valueArray = Array.isArray(value) ? value : [value];
    const currentSelectedIds = state.selectedItems.map(engine['config'].getId);
    
    const needsHydration = JSON.stringify(valueArray) !== JSON.stringify(currentSelectedIds);

    if (needsHydration && !isHydratingRef.current) {
      isHydratingRef.current = true;
      engine.setValue(valueArray).finally(() => {
        isHydratingRef.current = false;
      });
    }
  }, [value, engine]);

  useEffect(() => {
    if (state.isHydrating || isHydratingRef.current) return;

    const selectedIds = state.selectedItems.map(item => engine['config'].getId(item));
    
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
