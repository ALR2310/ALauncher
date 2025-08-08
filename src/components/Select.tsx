import { useEffect, useRef, useState } from 'react';

interface OptionProps {
  value: string;
  label: string;
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
  render?: (option: OptionProps, select: (value: string) => void) => React.ReactNode;
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
  const [isOpen, setIsOpen] = useState(true);
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
        <ul
          className={`absolute ${position === 'top' ? 'bottom-full' : 'top-full'} right-0 my-1 p-2 rounded w-full bg-base-100 shadow z-10 overflow-y-auto max-h-96`}
        >
          {search && position === 'bottom' && (
            <li className="py-1">
              <input
                type="text"
                className="input input-sm w-full focus:outline-none focus-within:outline-none"
                placeholder={'Tìm kiếm...'}
                value={searchValue}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </li>
          )}
          {filteredOptions.map((option) => (
            <li
              key={option.value}
              className="px-3 py-1 cursor-pointer hover:bg-base-300"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectOption(option.value);
              }}
            >
              {render ? render(option, handleSelectOption) : <span>{option.label}</span>}
            </li>
          ))}
          {filteredOptions.length === 0 && (
            <li className="px-3 py-2 text-sm text-base-content/70 italic">{'Không có kết quả nào'}</li>
          )}
          {search && position === 'top' && (
            <li className="py-1">
              <input
                type="text"
                className="input input-sm w-full focus:outline-none focus-within:outline-none"
                placeholder={'Tìm kiếm...'}
                value={searchValue}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
