import React from 'react';
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

/**
 * MageSelect - React Hook Form Wrapper
 * 
 * High-level component that connects the MageSelectEngine to RHF.
 */
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
    engine, // We get back the resolved engine instance
  } = useMageSelectController<T, TFieldValues, TName>(props);

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
