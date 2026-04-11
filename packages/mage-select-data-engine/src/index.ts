export interface MageSelectEngineConfig<T> {
  fetchPage: (page: number, search: string) => Promise<{ items: T[]; hasMore: boolean }>;
  fetchByIds: (ids: string[]) => Promise<T[]>;
  getId: (item: T) => string;
  pageSize?: number;
}

export interface MageSelectEngineState<T> {
  items: T[];
  selectedItems: T[];
  isLoading: boolean;
  isHydrating: boolean;
  page: number;
  search: string;
  hasMore: boolean;
  error?: string;
  initialized: boolean;
}

type Listener<T> = (state: MageSelectEngineState<T>) => void;

export class MageSelectEngine<T> {
  private state: MageSelectEngineState<T> = {
    items: [],
    selectedItems: [],
    isLoading: false,
    isHydrating: false,
    hasMore: true,
    page: 1,
    search: '',
    initialized: false,
  };

  private cache = new Map<string, T>();
  private listeners: Set<Listener<T>> = new Set();
  private config: MageSelectEngineConfig<T>;

  constructor(config: MageSelectEngineConfig<T>) {
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
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  private persistToCache(items: T[]) {
    for (const item of items) {
      this.cache.set(this.config.getId(item), item);
    }
  }

  public async setSearch(term: string) {
    if (this.state.search === term) return;
    
    this.updateState({
      search: term,
      page: 1,
      items: [],
      hasMore: true,
      initialized: false,
      error: undefined,
    });
    
    await this.initialLoad();
  }

  public async initialLoad() {
    if (this.state.initialized || this.state.isLoading) return;
    this.updateState({ isLoading: true });
    try {
      const response = await this.config.fetchPage(this.state.page, this.state.search);
      this.persistToCache(response.items);
      this.updateState({
        items: response.items,
        hasMore: response.hasMore,
        isLoading: false,
        initialized: true,
      });
    } catch (e) {
      this.updateState({ isLoading: false, error: String(e) });
    }
  }

  public async loadMore() {
    if (this.state.isLoading || !this.state.hasMore) return;
    this.updateState({ isLoading: true });
    try {
      const nextPage = this.state.page + 1;
      const response = await this.config.fetchPage(nextPage, this.state.search);
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
      this.updateState({ isLoading: false, error: String(e) });
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
        this.updateState({ isHydrating: false, error: undefined });
      } catch (e) {
        this.updateState({ isHydrating: false, error: String(e) });
        return;
      }
    }

    const selectedItems = ids
      .map((id) => this.cache.get(id)!)
      .filter(Boolean);

    this.updateState({ selectedItems });
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
