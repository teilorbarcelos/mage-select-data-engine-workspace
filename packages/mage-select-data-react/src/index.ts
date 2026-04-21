import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

export function useMageSelect<T>(
  config: MageSelectEngineConfig<T> | MageSelectEngine<T>
) {
  const engineContext = useMemo(() => {
    if (config instanceof MageSelectEngine) {
      return { instance: config, isExternal: true };
    }
    return { instance: new MageSelectEngine(config), isExternal: false };
  }, []); /** Stable instance */

  const engine = engineContext.instance;

  /** Update config if it changes */
  if (!engineContext.isExternal && !(config instanceof MageSelectEngine)) {
    engine.updateConfig(config);
  }

  const state = useSyncExternalStore(
    (onStoreChange) => engine.subscribe(onStoreChange),
    () => engine.getState(),
    () => engine.getState()
  );

  const initialLoad = useCallback(() => engine.initialLoad(), [engine]);
  const loadMore = useCallback(() => engine.loadMore(), [engine]);
  const setSearch = useCallback((term: string) => engine.setSearch(term), [engine]);
  const setSearchFields = useCallback((fields: string[]) => engine.setSearchFields(fields), [engine]);
  const toggleSelection = useCallback((item: T) => engine.toggleSelection(item), [engine]);
  const setValue = useCallback((ids: string[]) => engine.setValue(ids), [engine]);

  return {
    state,
    engine,
    initialLoad,
    loadMore,
    setSearch,
    setSearchFields,
    toggleSelection,
    setValue,
  };
}
