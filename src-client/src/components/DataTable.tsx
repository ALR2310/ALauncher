import { ArrowDown, ArrowUp, ArrowUpDown, Settings } from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const tableSizeMap = {
  xs: 'table-xs',
  sm: 'table-sm',
  md: 'table-md',
  lg: 'table-lg',
  xl: 'table-xl',
} as const;

type SortDir = 'asc' | 'desc';

interface ColumnSetting {
  enabled?: boolean;
  className?: string;
}

export interface Column<T> {
  key: keyof T | string;
  title: React.ReactNode;
  show?: boolean;
  sortable?: boolean;
  toggleable?: boolean;
  className?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  className?: string;
  type?: 'default' | 'zebra';
  size?: keyof typeof tableSizeMap;
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

function TableRow<T>({
  row,
  cols,
  rowIdx,
  onRowClick,
}: {
  row: T;
  cols: Column<T>[];
  rowIdx: number;
  onRowClick?: (row: T, index: number) => void;
}) {
  return (
    <tr
      className={`hover:bg-base-300 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
      onClick={() => onRowClick?.(row, rowIdx)}
    >
      {cols.map((col, colIdx) => {
        const value = (row as any)[col.key];
        return (
          <td key={colIdx} className={col.className}>
            {col.render ? col.render(value, row, rowIdx) : String(value ?? '')}
          </td>
        );
      })}
    </tr>
  );
}

const MemoTableRow = memo(TableRow) as typeof TableRow;

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
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(
    columns.filter((c) => c.show !== false).map((c) => String(c.key)),
  );

  const visibleCols = useMemo(
    () => columns.filter((col) => visibleKeys.includes(String(col.key))),
    [columns, visibleKeys],
  );

  const [sortState, setSortState] = useState<{ key: string; dir: SortDir }>({
    key: '',
    dir: sortDir,
  });

  const sortIcons = useMemo(
    () => ({
      asc: <ArrowUp size={14} className="text-success" />,
      desc: <ArrowDown size={14} className="text-success" />,
      none: <ArrowUpDown size={14} />,
    }),
    [],
  );

  const toggleColumn = useCallback((key: string) => {
    setVisibleKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }, []);

  const handleSort = useCallback(
    (col: Column<T>) => {
      if (!col.sortable) return;

      setSortState((prev) => {
        const colKey = String(col.key);
        const isSame = prev.key === colKey;
        const nextDir: SortDir = isSame ? (prev.dir === 'asc' ? 'desc' : 'asc') : sortDir === 'asc' ? 'desc' : 'asc';
        onSortChange?.(colKey, nextDir);
        return { key: colKey, dir: nextDir };
      });
    },
    [onSortChange, sortDir],
  );

  const getSortIcon = useCallback(
    (col: Column<T>) => (!col.sortable ? null : sortState.key === col.key ? sortIcons[sortState.dir] : sortIcons.none),
    [sortIcons, sortState],
  );

  const loadingRows = useMemo(() => Array.from({ length: loadingCount }), [loadingCount]);

  // Infinite scroll observer
  useEffect(() => {
    if (!onReachEnd || !sentinelRef.current) return;
    const el = sentinelRef.current;

    let timeout: number;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          clearTimeout(timeout);
          timeout = window.setTimeout(() => onReachEnd(), 300);
        }
      },
      {
        root: containerRef.current,
        rootMargin: observerRootMargin ?? '100px',
        threshold: 0.1,
      },
    );

    observer.observe(el);
    return () => {
      clearTimeout(timeout);
      observer.unobserve(el);
      observer.disconnect();
    };
  }, [onReachEnd, isLoading, observerRootMargin]);

  // Sync visibleKeys when columns change
  useEffect(() => {
    setVisibleKeys(columns.filter((c) => c.show !== false).map((c) => String(c.key)));
  }, [columns]);

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
              <MemoTableRow key={rowIdx} row={row} cols={visibleCols} rowIdx={rowIdx} onRowClick={onRowClick} />
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
        <div className={`absolute dropdown z-10 ${columnSetting?.className || 'dropdown-end'} right-2 top-2`}>
          <button className="btn btn-sm btn-soft btn-circle" onClick={() => setDropdownOpen((v) => !v)}>
            <Settings size={16} />
          </button>

          {isDropdownOpen && (
            <ul
              tabIndex={-1}
              className="dropdown-content menu flex-nowrap overflow-auto bg-base-200 rounded-box z-1 min-w-38 max-h-60 shadow mt-3"
            >
              {columns
                .filter((col) => col.toggleable !== false && col.key && col.title)
                .map((col, idx) => (
                  <li key={idx}>
                    <label className="flex items-center gap-2 cursor-pointer p-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checked:checkbox-success"
                        checked={visibleKeys.includes(String(col.key))}
                        onChange={() => toggleColumn(String(col.key))}
                      />
                      <span>{col.title}</span>
                    </label>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
