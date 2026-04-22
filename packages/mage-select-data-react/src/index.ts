import {
  MageSelectEngine,
  MageSelectEngineConfig,
  MageSelectEngineState,
} from "mage-select-data-engine";
import { useCallback, useMemo, useSyncExternalStore, useRef } from "react";
export interface UseMageSelectOptions<T> {
  autoInitialLoad?: boolean;
  onSelectionChange?: (items: T[]) => void;
}
export function useMageSelect<T>(
  config: MageSelectEngineConfig<T> | MageSelectEngine<T>,
  options: UseMageSelectOptions<T> = {},
) {
  const engineContext = useMemo(() => {
    if (config instanceof MageSelectEngine) {
      return { instance: config, isExternal: true };
    }
    const instance = new MageSelectEngine(config);
    return { instance, isExternal: false };
  }, []);
  const engine = engineContext.instance;
  if (!engineContext.isExternal && !(config instanceof MageSelectEngine)) {
    engine.updateConfig(config);
  }
  const state = useSyncExternalStore(
    (onStoreChange) => engine.subscribe(onStoreChange),
    () => engine.getState(),
    () => engine.getState(),
  );
  const initializedRef = useRef(false);
  if (
    options.autoInitialLoad &&
    !state.initialized &&
    !state.isLoading &&
    !initializedRef.current
  ) {
    initializedRef.current = true;
    engine.initialLoad();
  }
  const lastSelectedItemsRef = useRef<T[]>(state.selectedItems);
  if (
    options.onSelectionChange &&
    state.selectedItems !== lastSelectedItemsRef.current
  ) {
    lastSelectedItemsRef.current = state.selectedItems;
    options.onSelectionChange(state.selectedItems);
  }
  const initialLoad = useCallback(() => engine.initialLoad(), [engine]);
  const loadMore = useCallback(() => engine.loadMore(), [engine]);
  const loadPrevious = useCallback(() => engine.loadPrevious(), [engine]);
  const setSearch = useCallback(
    (term: string) => engine.setSearch(term),
    [engine],
  );
  const setSearchFields = useCallback(
    (fields: string[]) => engine.setSearchFields(fields),
    [engine],
  );
  const toggleSelection = useCallback(
    (item: T) => engine.toggleSelection(item),
    [engine],
  );
  const setValue = useCallback(
    (ids: string[]) => engine.setValue(ids),
    [engine],
  );
  return {
    state,
    engine,
    initialLoad,
    loadMore,
    loadPrevious,
    setSearch,
    setSearchFields,
    toggleSelection,
    setValue,
  };
}
