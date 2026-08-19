import React from 'react';
import { Search, X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', containerClassName = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center group">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-500 group-focus-within:text-violet-400 pointer-events-none flex items-center justify-center transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#12131A] border text-slate-100 text-xs sm:text-sm font-medium rounded-xl py-2.5 transition-all shadow-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 ${
              leftIcon ? 'pl-10' : 'pl-4'
            } ${rightIcon ? 'pr-10' : 'pr-4'} ${
              error ? 'border-rose-500/60 ring-2 ring-rose-500/20' : 'border-white/[0.08] hover:border-white/[0.16]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-slate-500 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] font-semibold text-rose-400 mt-1 flex items-center gap-1">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] font-medium text-slate-400 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, className = '', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        value={value}
        leftIcon={<Search className="w-4 h-4 text-slate-500" />}
        rightIcon={
          value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition cursor-pointer border-0 bg-transparent"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : undefined
        }
        className={className}
        {...props}
      />
    );
  }
);
SearchInput.displayName = 'SearchInput';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', containerClassName = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={`w-full bg-[#12131A] border text-slate-100 text-xs sm:text-sm font-medium rounded-xl p-3.5 transition-all shadow-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 ${
            error ? 'border-rose-500/60 ring-2 ring-rose-500/20' : 'border-white/[0.08] hover:border-white/[0.16]'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-[11px] font-semibold text-rose-400 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] font-medium text-slate-400 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', containerClassName = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={`w-full bg-[#12131A] border text-slate-100 text-xs sm:text-sm font-medium rounded-xl px-4 py-2.5 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 cursor-pointer ${
            error ? 'border-rose-500/60 ring-2 ring-rose-500/20' : 'border-white/[0.08] hover:border-white/[0.16]'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#12131A] text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[11px] font-semibold text-rose-400 mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
