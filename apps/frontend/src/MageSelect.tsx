import React, { useEffect, useRef } from 'react';
import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';
import { useMageSelectController } from 'mage-select-data-react-hook-form';
import { Control, FieldValues, Path, PathValue, UseControllerProps } from 'react-hook-form';
import { MageSelectView } from './MageSelectView';

export interface MageSelectProps<T, TFieldValues extends FieldValues, TName extends Path<TFieldValues>> {
  name: TName;
  control: Control<TFieldValues>;
  engineOrConfig: MageSelectEngine<T> | MageSelectEngineConfig<T>;
  renderItem: (item: T) => React.ReactNode;
  renderSelection: (selectedItems: T[]) => React.ReactNode;
  placeholder?: string;
  multiple?: boolean;
  valueType?: 'id' | 'object';
  rules?: UseControllerProps<TFieldValues, TName>['rules'];
  defaultValue?: PathValue<TFieldValues, TName>;
}

export function MageSelect<T, TFieldValues extends FieldValues, TName extends Path<TFieldValues>>(
  props: MageSelectProps<T, TFieldValues, TName>
) {
  const { 
    state, 
    loadMore, 
    toggleSelection, 
    setSearch, 
    field, 
    fieldState,
    engine,
    initialLoad,
    setValue,
  } = useMageSelectController<T, TFieldValues, TName>(props);

  const { value } = field;
  const { valueType = 'id' } = props;

  /** Track the last processed RHF value to prevent loops */
  const lastProcessedValueKeyRef = useRef<string | null>(null);

  /** 1. Initial Load */
  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  /** 2. Sync RHF value -> Engine (Hydration & External Changes) */
  useEffect(() => {
    const valueArray = (Array.isArray(value) ? value : (value ? [value] : [])) as (T | string)[];
    const incomingIds = valueType === 'object' 
      ? valueArray.filter(Boolean).map((v) => engine.getId(v as T))
      : valueArray.filter(Boolean).map(String);

    const incomingIdsKey = [...incomingIds].sort().join(',');
    
    /** Skip if this change was already processed by toggleSelection or a previous effect */
    if (incomingIdsKey === lastProcessedValueKeyRef.current) {
      return;
    }

    const currentSelectedIds = state.selectedItems.map(item => engine.getId(item));
    const currentIdsKey = [...currentSelectedIds].sort().join(',');

    if (incomingIdsKey !== currentIdsKey && !state.isHydrating) {
      lastProcessedValueKeyRef.current = incomingIdsKey;
      setValue(incomingIds);
    }
  }, [value, valueType, engine, state.selectedItems, state.isHydrating, setValue]);

  /**
   * Note: Selection -> RHF sync is now handled directly in useMageSelectController.toggleSelection
   * for immediate feedback and reliable RHF validation.
   */

  return (
    <MageSelectView
      state={state}
      toggleSelection={toggleSelection}
      setSearch={setSearch}
      loadMore={loadMore}
      renderItem={props.renderItem}
      renderSelection={props.renderSelection}
      getId={engine.getId.bind(engine)}
      placeholder={props.placeholder}
      multiple={props.multiple}
      invalid={fieldState.invalid}
      error={fieldState.error}
      onBlur={field.onBlur}
      fieldRef={field.ref}
    />
  );
}
