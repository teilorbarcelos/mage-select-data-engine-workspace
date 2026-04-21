export interface MageSelectEngineConfig<T> {
  fetchPage: (page: number, search: string, options: { searchFields?: string[]; signal?: AbortSignal }) => Promise<{ items: T[]; hasMore: boolean }>;
  fetchByIds: (ids: string[]) => Promise<T[]>;
  getId: (item: T) => string;
  pageSize?: number;
  searchFields?: string[];
  startPage?: number;
  cacheLimit?: number;
}

export interface MageSelectEngineState<T> {
  items: T[];
  selectedItems: T[];
  isLoading: boolean;
  isHydrating: boolean;
  page: number;
  search: string;
  searchFields: string[];
  hasMore: boolean;
  error?: string;
  initialized: boolean;
}

type Listener<T> = (state: MageSelectEngineState<T>) => void;

export class MageSelectEngine<T> {
  private state: MageSelectEngineState<T>;

  private cache = new Map<string, T>();
  private listeners: Set<Listener<T>> = new Set();
  private config: MageSelectEngineConfig<T>;
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;
  private abortController: AbortController | null = null;

  constructor(config: MageSelectEngineConfig<T>) {
    this.config = config;
    this.state = {
      items: [],
      selectedItems: [],
      isLoading: false,
      isHydrating: false,
      hasMore: true,
      page: config.startPage ?? 1,
      search: '',
      searchFields: config.searchFields ?? [],
      initialized: false,
    };
  }

  /**
   * Updates the engine configuration dynamically.
   * Useful in React environments where config might change between renders.
   */
  public updateConfig(config: MageSelectEngineConfig<T>) {
    this.config = config;
  }

  public getState() {
    return this.state;
  }

  public getId(item: T): string {
    return this.config.getId(item);
  }

  public subscribe(listener: Listener<T>) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((l) => l(currentState));
  }

  private updateState(partial: Partial<MageSelectEngineState<T>>) {
    const newState = { ...this.state, ...partial };
    
    const hasChanged = Object.keys(partial).some(
      (key) => this.state[key as keyof MageSelectEngineState<T>] !== newState[key as keyof MageSelectEngineState<T>]
    );

    if (!hasChanged) return;

    this.state = newState;
    this.notify();
  }

  private persistToCache(items: T[]) {
    for (const item of items) {
      this.cache.set(this.config.getId(item), item);
    }

    if (this.config.cacheLimit && this.cache.size > this.config.cacheLimit) {
      const entriesToRemove = this.cache.size - this.config.cacheLimit;
      const keys = this.cache.keys();
      for (let i = 0; i < entriesToRemove; i++) {
        const key = keys.next().value;
        if (key !== undefined) {
          this.cache.delete(key);
        }
      }
    }
  }

  public async setSearch(term: string) {
    if (this.state.search === term) return;
    
    this.updateState({ search: term });

    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.searchTimeout = setTimeout(async () => {
      this.updateState({
        page: this.config.startPage ?? 1,
        items: [],
        hasMore: true,
        initialized: false,
        error: undefined,
      });
      
      await this.initialLoad();
    }, 300);
  }

  public async initialLoad() {
    if (this.state.isLoading) return;
    
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const signal = this.abortController.signal;
    this.updateState({ isLoading: true });
    try {
      const response = await this.config.fetchPage(this.state.page, this.state.search, {
        searchFields: this.state.searchFields,
        signal,
      });
      this.persistToCache(response.items);
      this.updateState({
        items: response.items,
        hasMore: response.hasMore,
        isLoading: false,
        initialized: true,
      });
    } catch (e) {
      /* v8 ignore start */
      if (e instanceof Error && e.name === 'AbortError') {
        if (this.abortController?.signal === signal) {
          this.updateState({ isLoading: false });
        }
        return;
      }
      /* v8 ignore stop */
      this.updateState({ isLoading: false, error: String(e) });
    } finally {
      if (this.abortController?.signal === signal) {
        this.abortController = null;
      }
    }
  }

  public async loadMore() {
    if (this.state.isLoading || !this.state.hasMore) return;

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const signal = this.abortController.signal;
    this.updateState({ isLoading: true });
    try {
      const nextPage = this.state.page + 1;
      const response = await this.config.fetchPage(nextPage, this.state.search, {
        searchFields: this.state.searchFields,
        signal,
      });
      this.persistToCache(response.items);
      
      const existingIds = new Set(this.state.items.map(this.config.getId));
      const newItems = response.items.filter(
        (i) => !existingIds.has(this.config.getId(i))
      );

      this.updateState({
        items: [...this.state.items, ...newItems],
        page: nextPage,
        hasMore: response.hasMore,
        isLoading: false,
      });
    } catch (e) {
      /* v8 ignore start */
      if (e instanceof Error && e.name === 'AbortError') {
        if (this.abortController?.signal === signal) {
          this.updateState({ isLoading: false });
        }
        return;
      }
      /* v8 ignore stop */
      this.updateState({ isLoading: false, error: String(e) });
    } finally {
      if (this.abortController?.signal === signal) {
        this.abortController = null;
      }
    }
  }

  public async setValue(ids: string[]) {
    if (ids.length === 0) {
      this.updateState({ selectedItems: [] });
      return;
    }
    const missingIds = ids.filter((id) => !this.cache.has(id));

    if (missingIds.length > 0) {
      this.updateState({ isHydrating: true });
      try {
        const fetchedItems = await this.config.fetchByIds(missingIds);
        this.persistToCache(fetchedItems);
      } catch (e) {
        this.updateState({ isHydrating: false, error: String(e) });
        return;
      }
    }

    const selectedItems = ids
      .map((id) => this.cache.get(id)!)
      .filter(Boolean);

    this.updateState({ selectedItems, isHydrating: false, error: undefined });
  }

  public setSearchFields(fields: string[]) {
    this.updateState({
      searchFields: fields,
      page: this.config.startPage ?? 1,
      items: [],
      hasMore: true,
      initialized: false,
    });
    
    if (this.state.search) {
      this.initialLoad();
    }
  }

  public toggleSelection(item: T) {
    const id = this.config.getId(item);
    const existingIndex = this.state.selectedItems.findIndex(
      (si) => this.config.getId(si) === id
    );

    let newSelected: T[];
    if (existingIndex > -1) {
      newSelected = [
        ...this.state.selectedItems.slice(0, existingIndex),
        ...this.state.selectedItems.slice(existingIndex + 1),
      ];
    } else {
      newSelected = [...this.state.selectedItems, item];
    }
    this.updateState({ selectedItems: newSelected });
  }
}

export function createMageSelectEngine<T>(config: MageSelectEngineConfig<T>) {
  return new MageSelectEngine(config);
}
