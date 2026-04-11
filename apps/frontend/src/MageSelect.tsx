import { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useMageSelectController } from 'mage-react-hook-form';
import { MageSelectEngineConfig } from 'mage-select-data-engine';
import { Control, FieldValues, Path } from 'react-hook-form';

export interface MageSelectProps<T, TFieldValues extends FieldValues, TName extends Path<TFieldValues>> {
  name: TName;
  control: Control<TFieldValues>;
  engineConfig: MageSelectEngineConfig<T>;
  renderItem: (item: T) => ReactNode;
  renderSelection: (items: T[]) => string;
  placeholder?: string;
  multiple?: boolean;
}

export function MageSelect<T, TFieldValues extends FieldValues, TName extends Path<TFieldValues>>(
  props: MageSelectProps<T, TFieldValues, TName>
) {
  const { name, control, engineConfig, renderItem, renderSelection, placeholder, multiple } = props;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLLIElement>(null);

  const { state, loadMore, toggleSelection, setSearch } = useMageSelectController<T, TFieldValues, TName>({
    name,
    control,
    engineOrConfig: engineConfig,
    multiple,
  });

  const { items, selectedItems, isLoading, isHydrating, hasMore } = state;
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, setSearch]);

  // Reset local search when closed to optionally clear filter, but leaving it as is works too
  useEffect(() => {
    if (!isOpen && searchTerm !== '') {
       // Optional: clear search on close, but keeping it is fine.
    }
  }, [isOpen, searchTerm]);

  // Handle external clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Infinite Scroll Observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoading && isOpen) {
        loadMore();
      }
    },
    [loadMore, hasMore, isLoading, isOpen]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '20px',
      threshold: 0,
    });
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [handleObserver, isOpen]);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const isSelected = (item: T) => {
    const id = engineConfig.getId(item);
    return selectedItems.some((si) => engineConfig.getId(si) === id);
  };

  return (
    <div className="mage-select-container" ref={containerRef}>
      <div
        className={`mage-select-trigger ${isOpen ? 'open' : ''} ${isHydrating ? 'hydrating' : ''}`}
        onClick={toggleOpen}
      >
        <div className="mage-select-value">
          {isHydrating ? 'Loading selection...' : selectedItems.length > 0 ? renderSelection(selectedItems) : <span className="placeholder">{placeholder || 'Select...'}</span>}
        </div>
        <div className="mage-select-chevron">▼</div>
      </div>

      {isOpen && (
        <div className="mage-select-dropdown">
          <div className="mage-select-search-container">
             <input 
               type="text" 
               className="mage-select-search-input" 
               placeholder="Search..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               autoFocus
             />
          </div>
          <ul className="mage-select-list">
            {items.map((item) => (
              <li
                key={engineConfig.getId(item)}
                className={`mage-select-item ${isSelected(item) ? 'selected' : ''}`}
                onClick={() => {
                  toggleSelection(item);
                  if (!multiple) {
                    setIsOpen(false);
                  }
                }}
              >
                {renderItem(item)}
              </li>
            ))}

            {isLoading && (
              <li className="mage-select-loading-spinner">Carregando...</li>
            )}
            {!hasMore && items.length > 0 && (
              <li className="mage-select-end-message">Não há mais resultados</li>
            )}
            {!hasMore && items.length === 0 && !isLoading && (
              <li className="mage-select-end-message">Nenhum item encontrado</li>
            )}
            <li ref={loaderRef} style={{ height: 1 }} />
          </ul>
        </div>
      )}
    </div>
  );
}
