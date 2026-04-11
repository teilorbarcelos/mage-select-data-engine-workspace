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
  error?: { message?: string };
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

  const { items, selectedItems, isLoading, isHydrating, hasMore } = state;

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

      {error && (
        <div className="mage-select-error-message">{error.message}</div>
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
              <li className="mage-select-load-more">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadMore();
                  }} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load more'}
                </button>
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
