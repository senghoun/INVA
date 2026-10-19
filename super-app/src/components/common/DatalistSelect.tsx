import React, { useState, useEffect, useId, useRef, useMemo, useCallback } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';

export interface DatalistOption {
  id: string;
  label: string;
  sublabel?: string;
}

export type RawDatalistOption =
  | DatalistOption
  | string
  | { value: string | number; label: string; sublabel?: string };

export interface DatalistSelectProps {
  id?: string;
  value: string | number;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  options: RawDatalistOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  accentColor?: 'indigo' | 'purple' | 'amber' | 'emerald' | 'blue';
  allowCustomValue?: boolean;
  size?: 'sm' | 'md';
  hideSearchIcon?: boolean;
  dropdownAlign?: 'left' | 'right';
}

export const DatalistSelect: React.FC<DatalistSelectProps> = ({
  id,
  value,
  onChange,
  onSelect,
  options,
  placeholder = 'Type to search...',
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  accentColor = 'indigo',
  allowCustomValue = false,
  size = 'md',
  hideSearchIcon = false,
  dropdownAlign = 'left',
}) => {
  const generatedId = useId();
  const listId = id ? `dl-${id}` : `dl-${generatedId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize options to uniform { id: string, label: string, sublabel?: string }
  const normalizedOptions: DatalistOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { id: opt, label: opt, sublabel: undefined };
      }
      if ('value' in opt) {
        return {
          id: String(opt.value),
          label: opt.label,
          sublabel: opt.sublabel,
        };
      }
      return {
        id: String(opt.id),
        label: opt.label,
        sublabel: opt.sublabel,
      };
    });
  }, [options]);

  // Current selected option derived from value
  const selectedOption = useMemo(() => {
    const valStr = String(value ?? '');
    if (!valStr) return null;
    return normalizedOptions.find((o) => o.id === valStr || o.label === valStr) || null;
  }, [value, normalizedOptions]);

  const [inputText, setInputText] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  // Sync displayed text with selected value
  useEffect(() => {
    if (selectedOption) {
      setInputText(selectedOption.label);
    } else if (value && allowCustomValue) {
      setInputText(String(value));
    } else if (!value) {
      setInputText('');
    }
  }, [selectedOption, value, allowCustomValue]);

  // Filter options: if the text currently matches the selected option's label,
  // show ALL options (with current selection checked). If user edits the text, filter dynamically.
  const filteredOptions = useMemo(() => {
    if (!inputText.trim()) return normalizedOptions;
    if (
      selectedOption &&
      inputText.trim().toLowerCase() === selectedOption.label.trim().toLowerCase()
    ) {
      return normalizedOptions;
    }
    const q = inputText.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        opt.id.toLowerCase().includes(q)
    );
  }, [normalizedOptions, inputText, selectedOption]);

  // When opening dropdown, pre-highlight the currently selected item
  useEffect(() => {
    if (isOpen && selectedOption) {
      const idx = filteredOptions.findIndex((o) => o.id === selectedOption.id);
      if (idx !== -1) {
        setHighlightedIndex(idx);
      }
    }
  }, [isOpen, selectedOption, filteredOptions]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (!allowCustomValue) setInputText(selectedOption?.label || '');
  }, [allowCustomValue, selectedOption]);

  const openDropdown = () => {
    if (disabled) return;
    window.dispatchEvent(new CustomEvent('inva:datalist-open', { detail: generatedId }));
    setIsOpen(true);
  };

  // Pointer and keyboard focus changes both close the previous list.
  useEffect(() => {
    const outside = (event: Event) => {
      if (isOpen && !containerRef.current?.contains(event.target as Node)) closeDropdown();
    };
    const anotherOpened = (event: Event) => {
      if (isOpen && (event as CustomEvent<string>).detail !== generatedId) closeDropdown();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    window.addEventListener('inva:datalist-open', anotherOpened);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      window.removeEventListener('inva:datalist-open', anotherOpened);
    };
  }, [isOpen, closeDropdown, generatedId]);

  useEffect(() => { if (disabled) closeDropdown(); }, [disabled, closeDropdown]);

  const handleSelectOption = (opt: DatalistOption) => {
    setInputText(opt.label);
    onChange(opt.id);
    onSelect?.(opt.id);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);
    openDropdown();
    setHighlightedIndex(0);

    if (!text.trim()) {
      onChange('');
      return;
    }

    const exactMatch = normalizedOptions.find(
      (o) =>
        o.label.trim().toLowerCase() === text.trim().toLowerCase() ||
        o.id.trim().toLowerCase() === text.trim().toLowerCase()
    );

    if (exactMatch) {
      onChange(exactMatch.id);
    } else if (allowCustomValue) {
      onChange(text);
    } else {
      onChange('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        openDropdown();
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        openDropdown();
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      if (isOpen) { e.preventDefault(); e.stopPropagation(); closeDropdown(); }
    }
  };

  // Accent color styles
  const accentClasses = {
    indigo: {
      border: 'focus:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/30',
      activeItem: 'bg-indigo-500/15 text-indigo-300',
      hoverItem: 'hover:bg-indigo-500/10 hover:text-indigo-200',
      badge: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/40',
      check: 'text-indigo-400',
    },
    purple: {
      border: 'focus:border-purple-500 focus-visible:ring-1 focus-visible:ring-purple-500/30',
      activeItem: 'bg-purple-500/15 text-purple-300',
      hoverItem: 'hover:bg-purple-500/10 hover:text-purple-200',
      badge: 'bg-purple-950/80 text-purple-400 border-purple-800/40',
      check: 'text-purple-400',
    },
    amber: {
      border: 'focus:border-amber-500 focus-visible:ring-1 focus-visible:ring-amber-500/30',
      activeItem: 'bg-amber-500/15 text-amber-300',
      hoverItem: 'hover:bg-amber-500/10 hover:text-amber-200',
      badge: 'bg-amber-950/80 text-amber-400 border-amber-800/40',
      check: 'text-amber-400',
    },
    emerald: {
      border: 'focus:border-emerald-500 focus-visible:ring-1 focus-visible:ring-emerald-500/30',
      activeItem: 'bg-emerald-500/15 text-emerald-300',
      hoverItem: 'hover:bg-emerald-500/10 hover:text-emerald-200',
      badge: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40',
      check: 'text-emerald-400',
    },
    blue: {
      border: 'focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/30',
      activeItem: 'bg-blue-500/15 text-blue-300',
      hoverItem: 'hover:bg-blue-500/10 hover:text-blue-200',
      badge: 'bg-blue-950/80 text-blue-400 border-blue-800/40',
      check: 'text-blue-400',
    },
  }[accentColor];

  const isSmall = size === 'sm';

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center w-full ${isSmall ? 'h-8' : 'h-10'} ${className}`}
    >
      {/* Search indicator icon (optional) */}
      {!hideSearchIcon && (
        <Search
          className={`text-slate-400 absolute pointer-events-none transition-colors ${
            isSmall ? 'w-3.5 h-3.5 left-2.5' : 'w-4 h-4 left-3.5'
          }`}
        />
      )}

      {/* Clean, sleek input matching project design system */}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onFocus={(e) => {
          openDropdown();
          e.currentTarget.select();
        }}
        onClick={openDropdown}
        onBlur={event => { if (!containerRef.current?.contains(event.relatedTarget as Node)) closeDropdown(); }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={isOpen ? `${listId}-options` : undefined}
        aria-activedescendant={isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length ? `${listId}-option-${highlightedIndex}` : undefined}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        className={`w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 transition-colors outline-none ${accentClasses.border} ${
          isSmall
            ? `${hideSearchIcon ? 'pl-2.5' : 'pl-8'} pr-8 h-8 text-xs rounded-lg`
            : `${hideSearchIcon ? 'pl-3.5' : 'pl-10'} pr-9 h-10 text-sm rounded-xl`
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${inputClassName}`}
      />

      {/* Dropdown Chevron Indicator */}
      <ChevronDown
        className={`text-slate-500 absolute pointer-events-none transition-transform duration-200 ${
          isSmall ? 'w-3.5 h-3.5 right-2.5' : 'w-4 h-4 right-3'
        } ${isOpen ? 'rotate-180 text-indigo-400' : ''}`}
      />

      {/* Semantic HTML5 Datalist for standard DOM accessibility */}
      <datalist id={listId}>
        {normalizedOptions.map((opt) => (
          <option key={opt.id} value={opt.label}>
            {opt.sublabel ? `(${opt.sublabel})` : undefined}
          </option>
        ))}
      </datalist>

      {/* Improved, Theme-Matched Cyberpunk Dropdown List */}
      {isOpen && (
        <div
          id={`${listId}-options`}
          role="listbox"
          className={`absolute top-full ${
            dropdownAlign === 'right' ? 'right-0' : 'left-0'
          } mt-1.5 z-50 min-w-full w-max max-w-sm sm:max-w-md bg-[#111624] border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-2xl max-h-56 overflow-y-auto p-1.5 transition-all animate-in fade-in slide-in-from-top-1 duration-150`}
          style={{ boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.05)' }}
        >
          {filteredOptions.length > 0 ? (
            <div className="space-y-0.5">
              {filteredOptions.map((opt, idx) => {
                const isSelected = selectedOption?.id === opt.id;
                const isHighlighted = highlightedIndex === idx;

                return (
                  <div
                    key={opt.id}
                    id={`${listId}-option-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input onBlur before click
                      handleSelectOption(opt);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onMouseLeave={() => setHighlightedIndex(-1)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected || isHighlighted
                        ? accentClasses.activeItem
                        : 'text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col pr-2 overflow-hidden">
                      <span className="font-medium truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className={`text-[10px] truncate mt-0.5 ${isSelected || isHighlighted ? 'text-current opacity-70' : 'text-slate-400'}`}>
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    <Check aria-hidden="true" className={`w-3.5 h-3.5 flex-shrink-0 ${accentClasses.check} ${isSelected ? '' : 'invisible'}`} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-3 text-center text-xs text-slate-400">
              No matching results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatalistSelect;
