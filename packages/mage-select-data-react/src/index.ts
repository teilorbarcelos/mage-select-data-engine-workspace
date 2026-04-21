import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';
import { useEffect, useMemo, useSyncExternalStore } from 'react';

export function useMageSelect<T>(
  config: MageSelectEngineConfig<T> | MageSelectEngine<T>
) {
  const engineContext = useMemo(() => {
    if (config instanceof MageSelectEngine) {
      return { instance: config, isExternal: true };
    }
    return { instance: new MageSelectEngine(config), isExternal: false };
  }, []); // Stable instance

  const engine = engineContext.instance;

  useMemo(() => {
    if (!engineContext.isExternal && !(config instanceof MageSelectEngine)) {
      engine.updateConfig(config);
    }
  }, [config, engine, engineContext.isExternal]);

  const state = useSyncExternalStore(
    (onStoreChange) => engine.subscribe(onStoreChange),
    () => engine.getState(),
    () => engine.getState()
  );

  useEffect(() => {
    engine.initialLoad();
  }, [engine]);

  return {
    state,
    engine,
    loadMore: () => engine.loadMore(),
    setSearch: (term: string) => engine.setSearch(term),
    setSearchFields: (fields: string[]) => engine.setSearchFields(fields),
    toggleSelection: (item: T) => engine.toggleSelection(item),
    setValue: (ids: string[]) => engine.setValue(ids),
  };
}
