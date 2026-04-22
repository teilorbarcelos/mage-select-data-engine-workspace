import React, { useMemo } from "react";
import {
  MageSelectEngine,
  MageSelectEngineConfig,
} from "mage-select-data-engine";
import { useMageSelect } from "mage-select-data-react";
import { MageSelectView } from "./MageSelectView";
export interface VanillaMageSelectProps<T, V extends "id" | "object" = "id"> {
  engineConfig: MageSelectEngineConfig<T>;
  renderItem: (item: T) => React.ReactNode;
  renderSelection: (selectedItems: T[]) => React.ReactNode;
  placeholder?: string;
  multiple?: boolean;
  valueType?: V;
  onSelectionChange?: (items: V extends "id" ? string[] : T[]) => void;
  engine?: MageSelectEngine<T>;
}
export function VanillaMageSelect<T, V extends "id" | "object" = "id">({
  engineConfig,
  renderItem,
  renderSelection,
  placeholder,
  multiple = true,
  valueType = "id" as V,
  onSelectionChange,
  engine: externalEngine,
}: VanillaMageSelectProps<T, V>) {
  const handleSelectionChange = useMemo(
    () => (items: T[]) => {
      if (!onSelectionChange) return;
      if (valueType === "id") {
        const ids = items.map((i) => (externalEngine || engineConfig).getId(i));
        (onSelectionChange as (items: string[]) => void)(ids);
      } else {
        (onSelectionChange as (items: T[]) => void)(items);
      }
    },
    [onSelectionChange, valueType, externalEngine, engineConfig],
  );
  const { state, loadMore, loadPrevious, toggleSelection, setSearch, engine } =
    useMageSelect<T>(externalEngine || engineConfig, {
      autoInitialLoad: true,
      onSelectionChange: handleSelectionChange,
    });
  return (
    <MageSelectView
      state={state}
      toggleSelection={toggleSelection}
      setSearch={setSearch}
      loadMore={loadMore}
      loadPrevious={loadPrevious}
      renderItem={renderItem}
      renderSelection={renderSelection}
      getId={engine.getId.bind(engine)}
      placeholder={placeholder}
      multiple={multiple}
    />
  );
}
