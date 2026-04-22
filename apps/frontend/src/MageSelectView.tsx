import React, { useRef, useState, useCallback, useLayoutEffect } from "react";
import { MageSelectEngineState } from "mage-select-data-engine";
export interface MageSelectViewProps<T> {
  state: MageSelectEngineState<T>;
  toggleSelection: (item: T) => void;
  setSearch: (term: string) => void;
  loadMore: () => void;
  loadPrevious: () => void;
  renderItem: (item: T) => React.ReactNode;
  renderSelection: (selectedItems: T[]) => React.ReactNode;
  getId: (item: T) => string;
  placeholder?: string;
  multiple?: boolean;
  invalid?: boolean;
  error?: string | { message?: string };
  name?: string;
  onBlur?: () => void;
  fieldRef?: React.Ref<HTMLInputElement>;
}
export function MageSelectView<T>({
  state,
  toggleSelection,
  setSearch,
  loadMore,
  loadPrevious,
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
  const [searchTerm, setSearchTerm] = useState("");
  const listRef = useRef<HTMLUListElement | null>(null);
  const isLoadingRef = useRef(false);
  const anchorRef = useRef<{ id: string; offsetTop: number } | null>(null);
  const {
    items,
    selectedItems,
    isLoading,
    isHydrating,
    hasMore,
    hasPrevious,
    initialized,
    error: stateError,
  } = state;
  isLoadingRef.current = isLoading;
  const displayError = error || stateError;
  const errorMessage =
    typeof displayError === "string" ? displayError : displayError?.message;
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || isLoading) return;
    if (anchorRef.current) {
      const anchorNode = list.querySelector(
        `[data-id="${anchorRef.current.id}"]`,
      ) as HTMLElement;
      if (anchorNode) {
        const diff = anchorNode.offsetTop - anchorRef.current.offsetTop;
        if (diff !== 0) {
          list.scrollTop += diff;
        }
      }
      anchorRef.current = null;
    }
    if (!stateError && initialized && !isLoading) {
      const isAtBottom =
        list.scrollHeight - list.scrollTop <= list.clientHeight + 50;
      const isAtTop = list.scrollTop <= 50;
      if (isAtBottom && hasMore) {
        createAnchor();
        loadMore();
      } else if (isAtTop && hasPrevious) {
        createAnchor();
        loadPrevious();
      }
    }
  }, [
    items,
    isLoading,
    hasMore,
    hasPrevious,
    initialized,
    stateError,
    loadMore,
    loadPrevious,
  ]);
  const createAnchor = useCallback(() => {
    const list = listRef.current;
    if (!list || items.length === 0) return;
    const children = Array.from(list.children) as HTMLElement[];
    const anchorNode =
      children.find((child) => child.offsetTop >= list.scrollTop) ||
      children[0];
    if (anchorNode && anchorNode.dataset.id) {
      anchorRef.current = {
        id: anchorNode.dataset.id,
        offsetTop: anchorNode.offsetTop,
      };
    }
  }, [items]);
  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    if (!initialized || stateError || isLoadingRef.current) return;
    const list = e.currentTarget;
    if (list.scrollTop <= 50 && hasPrevious) {
      createAnchor();
      loadPrevious();
    } else if (
      list.scrollHeight - list.scrollTop <= list.clientHeight + 50 &&
      hasMore
    ) {
      createAnchor();
      loadMore();
    }
  };
  const handleClose = () => {
    if (onBlur) onBlur();
    setSearchTerm("");
    setSearch("");
    setIsOpen(false);
  };
  return (
    <div className="mage-select-container">
      {isOpen && (
        <div
          className="mage-select-backdrop"
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 998,
            cursor: "default",
          }}
        />
      )}
      <div
        className="mage-select-search-wrapper"
        style={{ position: "relative", zIndex: 999 }}
      >
        <input
          type="text"
          className={`mage-select-search-input main ${isOpen ? "open" : ""} ${invalid ? "invalid" : ""}`}
          placeholder={
            searchTerm === "" && !multiple && selectedItems.length > 0
              ? String(renderSelection(selectedItems))
              : placeholder || "Search and select..."
          }
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          ref={fieldRef}
        />
        <button
          type="button"
          className="mage-select-chevron"
          onClick={() => (isOpen ? handleClose() : setIsOpen(true))}
        >
          {isHydrating ? <div className="spinner-mini" /> : isOpen ? "▲" : "▼"}
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
        <div className="mage-select-dropdown" style={{ zIndex: 1000 }}>
          <ul
            className="mage-select-list"
            ref={listRef}
            onScroll={handleScroll}
          >
            {hasPrevious && (
              <li
                className="mage-select-load-previous"
                style={{ height: "30px", margin: "10px 0" }}
              >
                {isLoading && (
                  <div className="spinner-mini" style={{ margin: "0 auto" }} />
                )}
              </li>
            )}
            {items.map((item) => (
              <li
                key={getId(item)}
                data-id={getId(item)}
                className={`mage-select-item ${selectedItems.some((i) => getId(i) === getId(item)) ? "selected" : ""}`}
                onClick={() => {
                  toggleSelection(item);
                  if (!multiple) handleClose();
                }}
              >
                {renderItem(item)}
              </li>
            ))}
            {hasMore && (
              <li
                className="mage-select-load-more"
                style={{ height: "30px", margin: "10px 0" }}
              >
                {isLoading && (
                  <div className="spinner-mini" style={{ margin: "0 auto" }} />
                )}
              </li>
            )}
            {!isLoading && items.length === 0 && !hasMore && (
              <li className="mage-select-no-results">No results found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
