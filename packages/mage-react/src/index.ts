import { useSyncExternalStore, useMemo, useEffect } from 'react';
import { MageSelectEngine, MageSelectEngineConfig } from 'mage-select-data-engine';

export function useMageSelect<T>(
  config: MageSelectEngineConfig<T> | MageSelectEngine<T>
) {
  // Use existing instance or create a new one based on config
  const engine = useMemo(() => {
    if (config instanceof MageSelectEngine) {
      return config;
    }
    return new MageSelectEngine(config);
  }, [config]);

  const state = useSyncExternalStore(
    (onStoreChange) => engine.subscribe(onStoreChange),
    () => engine.getState(),
    () => engine.getState() // Server snapshot fallback
  );

  useEffect(() => {
    // Attempt initial load only once automatically
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
