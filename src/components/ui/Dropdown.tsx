import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  description?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  label?: string;
  multiple?: boolean;
  searchable?: boolean;
  icon?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  label,
  multiple = false,
  searchable = false,
  icon,
  className = '',
  fullWidth = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isSelected = (val: string) => {
    if (Array.isArray(value)) {
      return value.includes(val);
    }
    return value === val;
  };

  const handleSelect = (optValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? [...value] : [];
      if (currentValues.includes(optValue)) {
        onChange(currentValues.filter(v => v !== optValue));
      } else {
        onChange([...currentValues, optValue]);
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  const getSelectedLabel = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        const found = options.find(o => o.value === value[0]);
        return found ? found.label : value[0];
      }
      return `${value.length} selected`;
    }
    const found = options.find(o => o.value === value);
    return found ? found.label : placeholder;
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'} ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2.5 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 ${
          isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/15' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          <span className={`truncate ${!value || (Array.isArray(value) && value.length === 0) ? 'text-slate-400' : 'text-slate-900'}`}>
            {getSelectedLabel()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {multiple && Array.isArray(value) && value.length > 0 && (
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-full">
              {value.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </div>
      </button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-2 w-full min-w-[220px] bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 p-2 space-y-1 max-h-72 overflow-hidden flex flex-col"
          >
            {/* Optional Search */}
            {searchable && (
              <div className="relative p-1 mb-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <div className="overflow-y-auto space-y-0.5 flex-1 pr-1">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 font-medium">
                  No matches found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const selected = isSelected(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        selected
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                      } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <div>
                          <div className="truncate">{opt.label}</div>
                          {opt.description && (
                            <div className="text-[10px] text-slate-400 font-normal truncate">
                              {opt.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {opt.badge && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                            {opt.badge}
                          </span>
                        )}
                        {selected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
