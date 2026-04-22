export interface MageSelectEngineConfig<T> {
  fetchPage: (
    page: number,
    search: string,
    options: { searchFields?: string[]; signal?: AbortSignal },
  ) => Promise<{ items: T[]; hasMore: boolean }>;
  fetchByIds: (ids: string[]) => Promise<T[]>;
  getId: (item: T) => string;
  pageSize?: number;
  searchFields?: string[];
  startPage?: number;
  cacheLimit?: number;
  biDirectionalRechargeable?: boolean;
  initialSelectedIds?: string[];
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
  startPage: number;
  hasPrevious: boolean;
}
type Listener<T> = (state: MageSelectEngineState<T>) => void;
export class MageSelectEngine<T> {
  private state: MageSelectEngineState<T>;
  private cache = new Map<string, T>();
  private listeners: Set<Listener<T>> = new Set();
  private config: MageSelectEngineConfig<T>;
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;
  private abortController: AbortController | null = null;
  private pageItemCounts: Map<number, number> = new Map();
  constructor(config: MageSelectEngineConfig<T>) {
    this.config = config;
    this.state = {
      items: [],
      selectedItems: [],
      isLoading: false,
      isHydrating: false,
      hasMore: true,
      page: config.startPage ?? 1,
      search: "",
      searchFields: config.searchFields ?? [],
      initialized: false,
      startPage: config.startPage ?? 1,
      hasPrevious: false,
    };
    if (config.initialSelectedIds && config.initialSelectedIds.length > 0) {
      this.setValue(config.initialSelectedIds);
    }
  }
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
      (key) =>
        this.state[key as keyof MageSelectEngineState<T>] !==
        newState[key as keyof MageSelectEngineState<T>],
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
        startPage: this.config.startPage ?? 1,
        hasPrevious: false,
      });
      this.pageItemCounts.clear();
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
      const response = await this.config.fetchPage(
        this.state.page,
        this.state.search,
        {
          searchFields: this.state.searchFields,
          signal,
        },
      );
      this.persistToCache(response.items);
      this.pageItemCounts.clear();
      this.pageItemCounts.set(this.state.page, response.items.length);
      this.updateState({
        items: response.items,
        hasMore: response.hasMore,
        isLoading: false,
        initialized: true,
        startPage: this.state.page,
        hasPrevious: this.state.startPage > 1,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        if (this.abortController?.signal === signal) {
          this.updateState({ isLoading: false });
        }
        return;
      }
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
      const response = await this.config.fetchPage(
        nextPage,
        this.state.search,
        {
          searchFields: this.state.searchFields,
          signal,
        },
      );
      this.persistToCache(response.items);
      const existingIds = new Set(this.state.items.map(this.config.getId));
      const newItems = response.items.filter(
        (i) => !existingIds.has(this.config.getId(i)),
      );
      this.pageItemCounts.set(nextPage, newItems.length);
      let items = [...this.state.items, ...newItems];
      let startPage = this.state.startPage;
      if (
        this.config.biDirectionalRechargeable &&
        nextPage - startPage + 1 > 3
      ) {
        const countToRemove = this.pageItemCounts.get(startPage) ?? 0;
        items = items.slice(countToRemove);
        this.pageItemCounts.delete(startPage);
        startPage++;
      }
      this.updateState({
        items,
        page: nextPage,
        startPage,
        hasMore: response.hasMore,
        hasPrevious: startPage > 1,
        isLoading: false,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        if (this.abortController?.signal === signal) {
          this.updateState({ isLoading: false });
        }
        return;
      }
      this.updateState({ isLoading: false, error: String(e) });
    } finally {
      if (this.abortController?.signal === signal) {
        this.abortController = null;
      }
    }
  }
  public async loadPrevious() {
    if (this.state.isLoading || !this.state.hasPrevious) return;
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.updateState({ isLoading: true });
    try {
      const prevPage = this.state.startPage - 1;
      const response = await this.config.fetchPage(
        prevPage,
        this.state.search,
        {
          searchFields: this.state.searchFields,
          signal,
        },
      );
      this.persistToCache(response.items);
      const existingIds = new Set(this.state.items.map(this.config.getId));
      const newItems = response.items.filter(
        (i) => !existingIds.has(this.config.getId(i)),
      );
      this.pageItemCounts.set(prevPage, newItems.length);
      let items = [...newItems, ...this.state.items];
      let endPage = this.state.page;
      if (this.config.biDirectionalRechargeable && endPage - prevPage + 1 > 3) {
        const countToRemove = this.pageItemCounts.get(endPage) ?? 0;
        items = items.slice(0, items.length - countToRemove);
        this.pageItemCounts.delete(endPage);
        endPage--;
      }
      this.updateState({
        items,
        page: endPage,
        startPage: prevPage,
        hasMore: true,
        hasPrevious: prevPage > 1,
        isLoading: false,
      });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        if (this.abortController?.signal === signal) {
          this.updateState({ isLoading: false });
        }
        return;
      }
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
    const selectedItems = ids.map((id) => this.cache.get(id)!).filter(Boolean);
    this.updateState({ selectedItems, isHydrating: false, error: undefined });
  }
  public setSearchFields(fields: string[]) {
    this.updateState({
      searchFields: fields,
      page: this.config.startPage ?? 1,
      startPage: this.config.startPage ?? 1,
      items: [],
      hasMore: true,
      hasPrevious: false,
      initialized: false,
    });
    this.pageItemCounts.clear();
    if (this.state.search) {
      this.initialLoad();
    }
  }
  public toggleSelection(item: T) {
    const id = this.config.getId(item);
    const existingIndex = this.state.selectedItems.findIndex(
      (si) => this.config.getId(si) === id,
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
