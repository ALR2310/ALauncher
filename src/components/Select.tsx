import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface OptionProps {
  value: string;
  label: string;
  [key: string]: any;
}

interface SelectProps {
  options: OptionProps[];
  value?: string;
  placeholder?: string;
  search?: boolean;
  className?: string;
  style?: React.CSSProperties;
  position?: 'top' | 'bottom';
  onChange?: (value: string, data: OptionProps) => void;
  render?: (item: OptionProps, select: (value: string) => void) => React.ReactNode;
  optionHeight?: number;
}

export default function Select(props: SelectProps) {
  const {
    options,
    value,
    placeholder,
    search,
    className,
    style,
    position = 'bottom',
    onChange,
    render,
    optionHeight,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const [searchValue, setSearchValue] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const portalContainer = useMemo<HTMLElement | null>(() => {
    const host = selectRef.current;
    if (!host) return null;
    const dlg = host.closest('dialog[open]') as HTMLElement | null;
    if (dlg) return dlg;
    const modalDiv = host.closest('.modal') as HTMLElement | null;
    return modalDiv ?? document.body; // fallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  const toggleDropdown = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsOpen((v) => !v);
  };
  const handleSelectOption = (v: string) => {
    const selectedOption = options.find((opt) => opt.value === v);
    setSelectedValue(v);
    setIsOpen(false);
    if (selectedOption) {
      onChange?.(v, selectedOption);
    }
  };

  const getSelectedLabel = (v: string) => options?.find((o) => o.value === v)?.label ?? placeholder;

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!isOpen) return;
      const target = ev.target as Node;
      if (selectRef.current && selectRef.current.contains(target)) return;
      setIsOpen(false);
      setSearchValue('');
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectRef.current) return;
    const update = () => {
      const r = selectRef.current!.getBoundingClientRect();
      setMenuRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen]);

  const filteredOptions = search
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchValue.toLowerCase()))
    : options;

  const MenuInner = (
    <div className="rounded bg-base-100 shadow" onClick={(e) => e.stopPropagation()} style={{ width: '100%' }}>
      {position === 'bottom' && search && (
        <div className="p-2 border-b border-base-300">
          <input
            className="input input-sm w-full focus:outline-none"
            placeholder="Search..."
            value={searchValue}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      )}
      <ul className="overflow-y-auto" style={{ maxHeight: `${optionHeight || 256}px` }}>
        {filteredOptions.map((item, index) => (
          <li
            key={index}
            className={`${render ? '' : 'px-3 py-1'} cursor-pointer hover:bg-base-300 ${
              selectedValue === item.value ? 'bg-base-300' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectOption(item.value);
            }}
          >
            {render ? render(item, handleSelectOption) : <span>{item.label}</span>}
          </li>
        ))}
        {filteredOptions.length === 0 && (
          <li className="px-3 py-2 text-sm text-base-content/70 italic">No results found</li>
        )}
      </ul>
      {position === 'top' && search && (
        <div className="p-2 border-t border-base-300">
          <input
            className="input input-sm w-full focus:outline-none"
            placeholder="Search..."
            value={searchValue}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      )}
    </div>
  );

  const MenuPlaced =
    isOpen && portalContainer
      ? createPortal(
          <div
            style={{
              position: 'fixed',
              zIndex: 2147483647,
              width: menuRect.width,
              left: menuRect.left,
              top: position === 'bottom' ? menuRect.top + menuRect.height + 4 : menuRect.top - 4,
              transform: position === 'top' ? 'translateY(-100%)' : 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {MenuInner}
          </div>,
          portalContainer,
        )
      : null;

  return (
    <div
      className={`select relative cursor-pointer ${className ?? ''}`}
      onClick={toggleDropdown}
      ref={selectRef}
      tabIndex={0}
      style={style}
    >
      {getSelectedLabel(selectedValue)}
      {MenuPlaced}
    </div>
  );
}
