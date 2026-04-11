import React, { useRef, useState, useEffect } from 'react';
import { MageSelectEngineState } from 'mage-select-data-engine';

export interface MageSelectViewProps<T> {
  state: MageSelectEngineState<T>;
  toggleSelection: (item: T) => void;
  setSearch: (term: string) => void;
  loadMore: () => void;
  renderItem: (item: T) => React.ReactNode;
  renderSelection: (selectedItems: T[]) => React.ReactNode;
  getId: (item: T) => string;
  placeholder?: string;
  multiple?: boolean;
  invalid?: boolean;
  error?: string | { message?: string };
  name?: string;
  onBlur?: () => void;
  fieldRef?: React.Ref<any>;
}

export function MageSelectView<T>({
  state,
  toggleSelection,
  setSearch,
  loadMore,
  renderItem,
  renderSelection,
  getId,
  placeholder,
  multiple = true,
  invalid,
  error,
  onBlur,
  fieldRef,
}: MageSelectViewProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLLIElement>(null);

  const { items, selectedItems, isLoading, isHydrating, hasMore, error: stateError } = state;
  const displayError = error || stateError;
  const errorMessage = typeof displayError === 'string' ? displayError : displayError?.message;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Only trigger onBlur and search reset if the dropdown was open
        if (isOpen) {
          if (onBlur) onBlur();
          // Reset search when closing
          setSearchTerm('');
          setSearch('');
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onBlur, setSearch, setSearchTerm]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!isOpen || !hasMore || isLoading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, {
      root: containerRef.current?.querySelector('.mage-select-dropdown'),
      threshold: 0.1,
    });

    const currentSentinel = loadMoreRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
      observer.disconnect();
    };
  }, [isOpen, hasMore, isLoading, loadMore]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setSearch(term);
    setIsOpen(true);
  };

  const toggleOpen = () => {
    if (isOpen) {
      setSearchTerm('');
      setSearch('');
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="mage-select-container" ref={containerRef}>
      <div className="mage-select-search-wrapper">
        <input 
          type="text" 
          className={`mage-select-search-input main ${isOpen ? 'open' : ''} ${invalid ? 'invalid' : ''}`} 
          placeholder={searchTerm === '' && !multiple && selectedItems.length > 0 
            ? String(renderSelection(selectedItems)) 
            : (placeholder || "Search and select...")} 
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          ref={fieldRef}
        />
        <button type="button" className="mage-select-chevron" onClick={toggleOpen}>
          {isHydrating ? <div className="spinner-mini" /> : (isOpen ? '▲' : '▼')}
        </button>
      </div>

      {multiple && selectedItems.length > 0 && (
        <div className="mage-select-selected-wrapper">
          {selectedItems.map((item) => (
            <div key={getId(item)} className="mage-select-chip">
              <span>{renderSelection([item])}</span>
              <button 
                type="button" 
                className="mage-select-chip-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelection(item);
                  if (onBlur) onBlur();
                }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {errorMessage && (
        <div className="mage-select-error-message">{errorMessage}</div>
      )}

      {isOpen && (
        <div className="mage-select-dropdown">
          <ul className="mage-select-list">
            {items.map((item) => (
              <li 
                key={getId(item)} 
                className={`mage-select-item ${selectedItems.some(i => getId(i) === getId(item)) ? 'selected' : ''}`}
                onClick={() => {
                  toggleSelection(item);
                  if (!multiple) {
                    setIsOpen(false);
                    setSearchTerm('');
                    setSearch('');
                  }
                }}
              >
                {renderItem(item)}
              </li>
            ))}
            {hasMore && (
              <li 
                ref={loadMoreRef} 
                className="mage-select-load-more"
                style={{ height: '10px', margin: '5px 0' }}
              >
                {isLoading && <div className="spinner-mini" style={{ margin: '0 auto' }} />}
              </li>
            )}
            {!isLoading && items.length === 0 && (
              <li className="mage-select-no-results">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
