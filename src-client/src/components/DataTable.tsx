import { ArrowDown, ArrowUp, ArrowUpDown, Settings } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const tableSizeMap = {
  xs: 'table-xs',
  sm: 'table-sm',
  md: 'table-md',
  lg: 'table-lg',
  xl: 'table-xl',
} as const;

interface ColumnSetting {
  enabled?: boolean;
  className?: string;
}

type SortDir = 'asc' | 'desc';

interface Column<T> {
  key: keyof T | string;
  title: React.ReactNode;
  show?: boolean;
  sortable?: boolean;
  className?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  className?: string;
  type?: 'default' | 'zebra';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  columns: Column<T>[];
  data?: T[];
  sortDir?: SortDir;
  isLoading?: boolean;
  loadingCount?: number;
  onSortChange?: (key: string, dir: SortDir) => void;
  onRowClick?: (row: T, index: number) => void;
  columnSetting?: ColumnSetting;
  emptyState?: React.ReactNode;
  onReachEnd?: () => void;
  observerRootMargin?: string;
}

export default function DataTable<T>({
  className = '',
  type = 'default',
  size = 'md',
  columns,
  data = [],
  sortDir = 'asc',
  isLoading = false,
  loadingCount = 5,
  onSortChange,
  onRowClick,
  columnSetting,
  emptyState = 'No contents found',
  onReachEnd,
  observerRootMargin,
}: DataTableProps<T>) {
  const sentinelRef = useRef<HTMLTableRowElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(
    columns.filter((c) => c.show !== false).map((c) => c.key as string),
  );
  const visibleCols = useMemo(
    () => columns.filter((col) => visibleKeys.includes(String(col.key))),
    [columns, visibleKeys],
  );
  const [sortState, setSortState] = useState<{ key: string; dir: SortDir }>(() => ({ key: '', dir: sortDir }));

  useEffect(() => {
    setSortState((prev) => ({ ...prev, dir: sortDir ?? prev.dir }));
  }, [sortDir]);

  const toggleColumn = useCallback((key: string) => {
    setVisibleKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }, []);

  const handleSort = useCallback(
    (col: Column<T>) => {
      if (!col.sortable) return;

      setSortState((prev) => {
        const colKey = String(col.key);
        const isSameCol = prev.key === colKey;
        const firstDirOnNewCol: SortDir = (sortDir ?? 'asc') === 'asc' ? 'desc' : 'asc';
        const nextDir: SortDir = isSameCol ? (prev.dir === 'asc' ? 'desc' : 'asc') : firstDirOnNewCol;
        onSortChange?.(colKey, nextDir);
        return { key: colKey, dir: nextDir };
      });
    },
    [onSortChange, sortDir],
  );

  const getSortIcon = (col: Column<T>) => {
    if (!col.sortable) return null;

    return sortState.key === col.key ? (
      sortState.dir === 'asc' ? (
        <ArrowUp size={14} className="text-success" />
      ) : (
        <ArrowDown size={14} className="text-success" />
      )
    ) : (
      <ArrowUpDown size={14} />
    );
  };

  const loadingRows = useMemo(() => Array.from({ length: loadingCount }), [loadingCount]);

  useEffect(() => {
    if (!onReachEnd || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading) {
          onReachEnd();
        }
      },
      {
        root: containerRef.current,
        rootMargin: observerRootMargin ?? '100px',
        threshold: 0.1,
      },
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onReachEnd, isLoading, observerRootMargin]);

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      <table className={`table ${tableSizeMap[size]} table-pin-rows ${type === 'zebra' ? 'table-zebra' : ''}`}>
        <thead>
          <tr>
            {visibleCols.map((col, idx) => (
              <th
                key={idx}
                className={`${col.className ?? ''} ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                onClick={() => handleSort(col)}
              >
                <div className="flex items-center gap-1">
                  {getSortIcon(col)}
                  <span>{col.title}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            loadingRows.map((_, idx) => (
              <tr key={`loading-${idx}`}>
                {visibleCols.map((_, j) => (
                  <td key={j}>
                    <div className="skeleton h-5 w-full"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`hover:bg-base-300 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row, rowIdx)}
              >
                {visibleCols.map((col, colIdx) => {
                  const value = (row as any)[col.key];
                  return (
                    <td key={colIdx} className={col.className}>
                      {col.render ? col.render(value, row, rowIdx) : String(value ?? '')}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={visibleCols.length} className="text-center opacity-70 py-6">
                {emptyState}
              </td>
            </tr>
          )}
          {onReachEnd && !isLoading && data.length > 0 && (
            <tr ref={sentinelRef} className="h-0">
              <td colSpan={visibleCols.length} className="h-0 p-0 border-0"></td>
            </tr>
          )}
        </tbody>
      </table>

      {columnSetting?.enabled !== false && (
        <div
          className={`absolute dropdown z-10 ${columnSetting?.className ? columnSetting.className : 'dropdown-end'} right-2 top-2`}
        >
          <button className="btn btn-sm btn-soft btn-circle">
            <Settings size={16} />
          </button>
          <ul tabIndex={-1} className="dropdown-content menu bg-base-200 rounded-box z-1 min-w-38 max-h-60 shadow mt-3">
            {columns.map((col, idx) => (
              <li key={idx}>
                <a className="flex">
                  <label className="flex-1 flex items-center gap-2 w-full cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checked:checkbox-success"
                      checked={visibleKeys.includes(String(col.key))}
                      onChange={() => toggleColumn(String(col.key))}
                    />
                    <span className="w-full">{col.title}</span>
                  </label>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
