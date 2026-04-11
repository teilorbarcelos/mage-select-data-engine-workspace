import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';
import { useEffect, useMemo, useSyncExternalStore } from 'react';

export function useMageSelect<T>(
  config: MageSelectEngineConfig<T> | MageSelectEngine<T>
) {
  const engine = useMemo(() => {
    if (config instanceof MageSelectEngine) {
      return config;
    }
    return new MageSelectEngine(config);
  }, [config]);

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
    toggleSelection: (item: T) => engine.toggleSelection(item),
    setValue: (ids: string[]) => engine.setValue(ids),
  };
}
