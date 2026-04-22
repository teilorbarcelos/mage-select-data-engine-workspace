import {
  MageSelectEngine,
  MageSelectEngineConfig,
} from "mage-select-data-engine";
import { useMageSelect, UseMageSelectOptions } from "mage-select-data-react";
import { useCallback } from "react";
import {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
  UseControllerProps,
  useController,
} from "react-hook-form";
export interface UseMageSelectControllerProps<
  T,
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
>
  extends
    Pick<
      UseControllerProps<TFieldValues, TName>,
      "name" | "control" | "rules" | "defaultValue"
    >,
    UseMageSelectOptions<T> {
  engineOrConfig: MageSelectEngine<T> | MageSelectEngineConfig<T>;
  multiple?: boolean;
  valueType?: "id" | "object";
}
export interface UseMageSelectControllerReturn<
  T,
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
> {
  state: ReturnType<typeof useMageSelect<T>>["state"];
  engine: MageSelectEngine<T>;
  loadMore: () => Promise<void>;
  loadPrevious: () => Promise<void>;
  setSearch: (term: string) => Promise<void>;
  setSearchFields: (fields: string[]) => void;
  toggleSelection: (item: T) => void;
  setValue: (ids: string[]) => Promise<void>;
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  initialLoad: () => Promise<void>;
}
export function useMageSelectController<
  T,
  TFieldValues extends FieldValues,
  TName extends Path<TFieldValues>,
>(
  props: UseMageSelectControllerProps<T, TFieldValues, TName>,
): UseMageSelectControllerReturn<T, TFieldValues, TName> {
  const {
    name,
    control,
    engineOrConfig,
    multiple = false,
    valueType = "id",
    ...mageOptions
  } = props;
  const { field, fieldState } = useController({
    name,
    control,
    rules: props.rules,
    defaultValue: props.defaultValue,
  });
  const engineHook = useMageSelect(engineOrConfig, mageOptions);
  const { engine } = engineHook;
  const toggleSelection = useCallback(
    (item: T) => {
      const currentIds = engine
        .getState()
        .selectedItems.map((i) => engine.getId(i));
      const isSelected = currentIds.includes(engine.getId(item));
      if (!multiple && !isSelected) {
        engine.setValue([]);
      }
      engine.toggleSelection(item);
      const nextSelectedItems = engine.getState().selectedItems;
      const selectedIds = nextSelectedItems.map((i) => engine.getId(i));
      const newValue = multiple
        ? valueType === "object"
          ? nextSelectedItems
          : selectedIds
        : nextSelectedItems.length > 0
          ? valueType === "object"
            ? nextSelectedItems[0]
            : selectedIds[0]
          : null;
      field.onChange(newValue);
    },
    [engine, multiple, valueType, field],
  );
  return {
    ...engineHook,
    toggleSelection,
    field,
    fieldState,
  };
}
