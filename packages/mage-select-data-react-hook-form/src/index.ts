import { useMageSelect } from 'mage-select-data-react';
import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';
import { useEffect, useRef } from 'react';
import { Control, FieldValues, Path, UseControllerProps, useController } from 'react-hook-form';

import { ControllerFieldState, ControllerRenderProps } from 'react-hook-form';

export interface UseMageSelectControllerProps<T, TFieldValues extends FieldValues, TName extends Path<TFieldValues>> 
  extends Pick<UseControllerProps<TFieldValues, TName>, 'name' | 'control' | 'rules' | 'defaultValue'> {
  engineOrConfig: MageSelectEngine<T> | MageSelectEngineConfig<T>;
  multiple?: boolean;
  valueType?: 'id' | 'object';
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
  const { name, control, engineOrConfig, multiple = false, valueType = 'id' } = props;
  
  const {
    field,
    fieldState
  } = useController({
    name,
    control,
    rules: props.rules,
    defaultValue: props.defaultValue,
  });

  const { value, onChange } = field;

  const engineHook = useMageSelect(engineOrConfig);
  const { engine, state } = engineHook;

  const isHydratingRef = useRef(false);
  const lastPushedValueRef = useRef<string>('');

  useEffect(() => {
    const valueArray = (Array.isArray(value) ? value : (value ? [value] : [])) as (T | string)[];
    const incomingIds = valueType === 'object' 
      ? valueArray.map((v) => engine.getId(v as T))
      : valueArray.map(String);

    const currentSelectedIds = state.selectedItems.map(item => engine.getId(item));
    
    const incomingIdsKey = [...incomingIds].sort().join(',');
    const currentIdsKey = [...currentSelectedIds].sort().join(',');

    const hasExternalChange = incomingIdsKey !== currentIdsKey && incomingIdsKey !== lastPushedValueRef.current;

    if (hasExternalChange && !isHydratingRef.current) {
      isHydratingRef.current = true;
      engine.setValue(incomingIds).finally(() => {
        isHydratingRef.current = false;
        lastPushedValueRef.current = incomingIdsKey;
      });
    }
  }, [value, valueType, engine, state.selectedItems]);

  useEffect(() => {
    if (state.isHydrating || isHydratingRef.current) return;

    const selectedIds = state.selectedItems.map(item => engine.getId(item));
    const currentFormArray = (Array.isArray(value) ? value : (value ? [value] : [])) as (T | string)[];
    const currentFormIds = valueType === 'object'
      ? currentFormArray.map((v) => engine.getId(v as T))
      : currentFormArray.map(String);

    const selectedIdsKey = [...selectedIds].sort().join(',');
    const currentFormIdsKey = [...currentFormIds].sort().join(',');

    const changed = selectedIdsKey !== currentFormIdsKey;

    if (changed) {
      const newValue = multiple 
        ? (valueType === 'object' ? state.selectedItems : selectedIds)
        : (state.selectedItems.length > 0 
            ? (valueType === 'object' ? state.selectedItems[0] : selectedIds[0])
            : null);
      
      lastPushedValueRef.current = selectedIdsKey;
      onChange(newValue);
    }
  }, [state.selectedItems, state.isHydrating, multiple, valueType, onChange, value, engine]);

  const controllerToggleSelection = (item: T) => {
    if (multiple) {
      engine.toggleSelection(item);
    } else {
      const isSelected = state.selectedItems.some(i => engine.getId(i) === engine.getId(item));
      if (isSelected) {
        engine.setValue([]);
      } else {
        engine.setValue([engine.getId(item)]);
      }
    }
  };

  return {
    ...engineHook,
    toggleSelection: controllerToggleSelection,
    field,
    fieldState,
  };
}
