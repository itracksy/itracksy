import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { FixedSizeList as List } from "react-window";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface VirtualizedSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  enableSearch?: boolean;
  isDisabled?: boolean;
}

export function VirtualizedSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  enableSearch = true,
  isDisabled = false,
}: VirtualizedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && enableSearch && inputRef.current) {
      // Wait for the dropdown to render before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [isOpen, enableSearch]);

  // Reset search when closing dropdown
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm || !enableSearch) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, enableSearch]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value);
  }, [options, value]);

  // Handle option selection
  const handleSelectOption = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      setIsOpen(false);
    },
    [onChange]
  );

  // Render each option row
  const ItemRow = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const option = filteredOptions[index];
      const isSelected = option.value === value;

      return (
        <div
          className={cn(
            "flex cursor-pointer items-center truncate px-2 py-1.5 text-sm",
            isSelected ? "bg-primary/10" : "hover:bg-muted"
          )}
          style={style}
          onClick={() => handleSelectOption(option.value)}
        >
          <div className="mr-2 flex h-4 w-4 items-center justify-center">
            {isSelected && <Check className="h-3.5 w-3.5" />}
          </div>
          {option.label}
        </div>
      );
    },
    [filteredOptions, value, handleSelectOption]
  );

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isDisabled && "cursor-not-allowed opacity-50",
          className
        )}
        disabled={isDisabled}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80">
          {/* Search input */}
          {enableSearch && (
            <div className="px-1 py-2">
              <Input
                ref={inputRef}
                type="text"
                className="h-8"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options list */}
          {filteredOptions.length > 0 ? (
            <List
              height={Math.min(35 * filteredOptions.length, 200)}
              itemCount={filteredOptions.length}
              itemSize={35}
              width="100%"
              className="scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
            >
              {ItemRow}
            </List>
          ) : (
            <div className="py-2 text-center text-sm text-muted-foreground">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
