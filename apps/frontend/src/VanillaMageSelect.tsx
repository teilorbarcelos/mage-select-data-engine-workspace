import React, { useEffect } from 'react';
import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';
import { useMageSelect } from 'mage-select-data-react';
import { MageSelectView } from './MageSelectView';

export interface VanillaMageSelectProps<T, V extends 'id' | 'object' = 'id'> {
  engineConfig: MageSelectEngineConfig<T>;
  renderItem: (item: T) => React.ReactNode;
  renderSelection: (selectedItems: T[]) => React.ReactNode;
  placeholder?: string;
  multiple?: boolean;
  valueType?: V;
  onSelectionChange?: (items: V extends 'id' ? string[] : T[]) => void;
  engine?: MageSelectEngine<T>; 
}

/**
 * VanillaMageSelect - Application level implementation
 */
export function VanillaMageSelect<T, V extends 'id' | 'object' = 'id'>({
  engineConfig,
  renderItem,
  renderSelection,
  placeholder,
  multiple = true,
  valueType = 'id' as V,
  onSelectionChange,
  engine: externalEngine
}: VanillaMageSelectProps<T, V>) {
  const { 
    state, 
    loadMore, 
    toggleSelection, 
    setSearch,
    engine,
    initialLoad,
  } = useMageSelect<T>(externalEngine || engineConfig);

  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  useEffect(() => {
    if (onSelectionChange) {
      if (valueType === 'id') {
        (onSelectionChange as (items: string[]) => void)(state.selectedItems.map(i => engine.getId(i)));
      } else {
        (onSelectionChange as (items: T[]) => void)(state.selectedItems);
      }
    }
  }, [state.selectedItems, onSelectionChange, valueType, engine]);

  return (
    <MageSelectView
      state={state}
      toggleSelection={toggleSelection}
      setSearch={setSearch}
      loadMore={loadMore}
      renderItem={renderItem}
      renderSelection={renderSelection}
      getId={engine.getId.bind(engine)}
      placeholder={placeholder}
      multiple={multiple}
    />
  );
}
