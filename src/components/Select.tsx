import { useEffect, useRef, useState } from 'react';

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
  onChange?: (value: string) => void;
  render?: (item: OptionProps, select: (value: string) => void) => React.ReactNode;
}

export default function Select({
  options,
  value,
  placeholder,
  search,
  className,
  style,
  position = 'bottom',
  onChange,
  render,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const [searchValue, setSearchValue] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelectOption = (value: string) => {
    setSelectedValue(value);
    setIsOpen(false);
    if (onChange) {
      onChange(value);
    }
  };

  const getSelectedLabel = (value: string) => {
    const selected = options?.find((option) => option?.value === value);
    return selected ? selected.label : placeholder;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchValue('');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredOptions = search
    ? options.filter((opt) => opt.label.toLowerCase().includes(searchValue.toLowerCase()))
    : options;

  return (
    <div
      className={`select relative cursor-pointer ${className}`}
      onClick={toggleDropdown}
      ref={selectRef}
      tabIndex={0}
      style={style}
    >
      {getSelectedLabel(selectedValue)}
      {isOpen && (
        <div
          className={`absolute ${position === 'top' ? 'bottom-full' : 'top-full'} right-0 my-1 rounded w-full bg-base-100 shadow z-10`}
          onClick={(e) => e.stopPropagation()} // tránh toggle khi bấm bên trong dropdown
        >
          {/* Nếu position = 'bottom' thì show search ở trên cùng */}
          {position === 'bottom' && search && (
            <div className="p-2 border-b border-base-300">
              <input
                type="text"
                className="input input-sm w-full focus:outline-none focus-within:outline-none"
                placeholder="Tìm kiếm..."
                value={searchValue}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          )}

          {/* Phần danh sách cuộn được (input không nằm trong phần này) */}
          <ul className="overflow-y-auto max-h-64">
            {filteredOptions.map((item) => (
              <li
                key={item.value}
                className={`${render ? undefined : 'px-3 py-1'} cursor-pointer hover:bg-base-300 ${
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
              <li className="px-3 py-2 text-sm text-base-content/70 italic">Không có kết quả nào</li>
            )}
          </ul>

          {/* Nếu position = 'top' thì show search ở dưới cùng */}
          {position === 'top' && search && (
            <div className="p-2 border-t border-base-300">
              <input
                type="text"
                className="input input-sm w-full focus:outline-none focus-within:outline-none"
                placeholder="Tìm kiếm..."
                value={searchValue}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
