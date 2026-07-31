import React from 'react';
import { SlidersHorizontal, RotateCcw, Filter, Sparkles } from 'lucide-react';
import { SearchInput } from './Input';
import { Dropdown, DropdownOption } from './Dropdown';
import { Chip } from './Badge';
import { Button } from './Button';

export interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: DropdownOption[];
  selectedSkillTags?: string[];
  onSkillTagToggle?: (tag: string) => void;
  availableSkillTags?: string[];
  sortValue?: string;
  onSortChange?: (sort: string) => void;
  sortOptions?: DropdownOption[];
  onResetFilters?: () => void;
  activeFilterCount?: number;
  placeholder?: string;
  className?: string;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories = [],
  selectedSkillTags = [],
  onSkillTagToggle,
  availableSkillTags = [],
  sortValue,
  onSortChange,
  sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'sessions', label: 'Most Experienced' },
    { value: 'newest', label: 'Newest Members' },
  ],
  onResetFilters,
  activeFilterCount = 0,
  placeholder = 'Search by name, skill, or keyword...',
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-4 ${className}`}>
      {/* Top Controls Row */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Main Search Bar */}
        <div className="w-full md:flex-1">
          <SearchInput
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
          />
        </div>

        {/* Category Dropdown */}
        {categories.length > 0 && onCategoryChange && (
          <div className="w-full md:w-52">
            <Dropdown
              options={[{ value: 'all', label: 'All Categories' }, ...categories]}
              value={selectedCategory || 'all'}
              onChange={(val) => onCategoryChange(val)}
              icon={<Filter className="w-4 h-4" />}
            />
          </div>
        )}

        {/* Sorting Dropdown */}
        {onSortChange && (
          <div className="w-full md:w-52">
            <Dropdown
              options={sortOptions}
              value={sortValue || 'recommended'}
              onChange={(val) => onSortChange(val)}
              icon={<SlidersHorizontal className="w-4 h-4" />}
            />
          </div>
        )}

        {/* Reset Button */}
        {activeFilterCount > 0 && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-slate-500 hover:text-slate-800 shrink-0"
          >
            Reset ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Available Skill Tag Chips */}
      {availableSkillTags.length > 0 && onSkillTagToggle && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Popular:</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {availableSkillTags.map((tag) => {
              const isActive = selectedSkillTags.includes(tag);
              return (
                <Chip
                  key={tag}
                  active={isActive}
                  onClick={() => onSkillTagToggle(tag)}
                  className="py-1 px-3 text-xs"
                >
                  {tag}
                </Chip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
