import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';
import { useMageSelect } from 'mage-select-data-react';
import { useCallback } from 'react';
import { ControllerFieldState, ControllerRenderProps, FieldValues, Path, UseControllerProps, useController } from 'react-hook-form';

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
  setSearchFields: (fields: string[]) => void;
  toggleSelection: (item: T) => void;
  setValue: (ids: string[]) => Promise<void>;
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  initialLoad: () => Promise<void>;
}

/**
 * useMageSelectController - RHF Adapter
 * 
 * Synchronizes user actions directly with React Hook Form to ensure
 * immediate validation and state consistency.
 */
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

  const engineHook = useMageSelect(engineOrConfig);
  const { engine } = engineHook;

  const toggleSelection = useCallback((item: T) => {
    if (!multiple) {
      engine.setValue([]);
    }
    
    engine.toggleSelection(item);
    
    const nextSelectedItems = engine.getState().selectedItems;
    const selectedIds = nextSelectedItems.map(i => engine.getId(i));
    
    const newValue = multiple 
      ? (valueType === 'object' ? nextSelectedItems : selectedIds)
      : (nextSelectedItems.length > 0 
          ? (valueType === 'object' ? nextSelectedItems[0] : selectedIds[0])
          : null);
    
    field.onChange(newValue);
  }, [engine, multiple, valueType, field]);

  return {
    ...engineHook,
    toggleSelection,
    field,
    fieldState,
  };
}
