import React, { useRef } from "react";
import {
  MageSelectEngine,
  MageSelectEngineConfig,
} from "mage-select-data-engine";
import { useMageSelectController } from "mage-select-data-react-hook-form";
import {
  Control,
  FieldValues,
  Path,
  PathValue,
  UseControllerProps,
} from "react-hook-form";
import { MageSelectView } from "./MageSelectView";
export interface MageSelectProps<
  T,
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> {
  name: TName;
  control: Control<TFieldValues>;
  engineOrConfig: MageSelectEngine<T> | MageSelectEngineConfig<T>;
  renderItem: (item: T) => React.ReactNode;
  renderSelection: (selectedItems: T[]) => React.ReactNode;
  placeholder?: string;
  multiple?: boolean;
  valueType?: "id" | "object";
  rules?: UseControllerProps<TFieldValues, TName>["rules"];
  defaultValue?: PathValue<TFieldValues, TName>;
}
export function MageSelect<
  T,
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
>(props: MageSelectProps<T, TFieldValues, TName>) {
  const { valueType = "id" } = props;
  const lastProcessedValueKeyRef = useRef<string | null>(null);
  const {
    state,
    loadMore,
    toggleSelection,
    setSearch,
    field,
    fieldState,
    engine,
    setValue,
    loadPrevious,
  } = useMageSelectController<T, TFieldValues, TName>({
    ...props,
    autoInitialLoad: true,
  });
  const { value } = field;
  const valueArray = (Array.isArray(value) ? value : value ? [value] : []) as (
    | T
    | string
  )[];
  const incomingIds =
    valueType === "object"
      ? valueArray.filter(Boolean).map((v) => engine.getId(v as T))
      : valueArray.filter(Boolean).map(String);
  const incomingIdsKey = [...incomingIds].sort().join(",");
  if (
    incomingIdsKey !== lastProcessedValueKeyRef.current &&
    !state.isHydrating
  ) {
    const currentSelectedIds = state.selectedItems.map((item) =>
      engine.getId(item),
    );
    const currentIdsKey = [...currentSelectedIds].sort().join(",");
    if (incomingIdsKey !== currentIdsKey) {
      lastProcessedValueKeyRef.current = incomingIdsKey;
      setValue(incomingIds);
    }
  }
  return (
    <MageSelectView
      state={state}
      toggleSelection={toggleSelection}
      setSearch={setSearch}
      loadMore={loadMore}
      loadPrevious={loadPrevious}
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
