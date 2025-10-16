import { ChevronsUpDownIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption<T = unknown> {
  key: T;
  value: T;
  label: string;
}

export type ComboboxProps<T = unknown> = {
  options: ComboboxOption<T>[];
  searchText: string;
  selectText: string;
  noOptionFoundText: string;
  className?: string;
  disabled?: boolean;
  allowMultipleSelect?: boolean | undefined;
  value?: T | T[];
  onChange: (value: T) => void;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  ariaLabel?: string;
}


export const Combobox = <T,>(props: ComboboxProps<T>) => {
  const { 
    options, 
    className, 
    disabled = false, 
    value, 
    selectText, 
    noOptionFoundText, 
    searchText, 
    onChange, 
    isOpen: externalIsOpen, 
    onOpenChange: externalOnOpenChange, 
    allowMultipleSelect, 
    ariaLabel 
  } = props;

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setOpen = externalOnOpenChange || setInternalIsOpen;

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          aria-expanded={isOpen}
          className={cn("w-full justify-between rounded-md font-medium hover:bg-gray-100",
            isOpen && "border ring-2 ring-offset-2 ring-gray-400",
            disabled && "text-gray-500 bg-gray-50 cursor-not-allowed",
            className)}
          variant="outline"
          aria-label={ariaLabel}
          disabled={disabled}
        >
          {allowMultipleSelect && Array.isArray(value) && value.length > 0 
          ? `${value.length} Selected`
          : value !== undefined && !Array.isArray(value) 
            ? options.find((o) => o.value === value)?.label
            : selectText}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      {allowMultipleSelect && Array.isArray(value) && value.length > 0 && (
        <XIcon 
          className={cn("absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 z-10",
            disabled 
            ? "text-gray-500 cursor-not-allowed pointer-events-none" 
            : "text-black opacity-60 hover:opacity-100 cursor-pointer")} 

          onClick={
            disabled 
            ? undefined 
            : (e) => {
              e.preventDefault();
              e.stopPropagation();
              (onChange as (value: T[]) => void)([]);
              if(setOpen) {
                setOpen(false);
              }
            }
          }
          aria-label="Clear selection"
          tabIndex={0}
          role="button"
          aria-disabled={disabled}
        />
      )}
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput disabled={disabled} placeholder={searchText} />
          <CommandList>
            <CommandEmpty>{noOptionFoundText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={String(option.value)}
                  value={option.label}
                  aria-selected={
                    allowMultipleSelect 
                    ? Array.isArray(value) && value.includes(option.value)
                      : value === option.value
                  }
                  disabled={disabled}
                  onSelect={() => {
                    if(disabled) {
                      return;
                    }
                    if(allowMultipleSelect) {
                      if(value !== undefined && Array.isArray(value)) {
                        const exists = value.includes(option.value);
                        const newValues = exists
                          ? (value ?? []).filter((v) => v !== option.value)
                          : [...(value ?? []), option.value];
                          
                        (onChange as (value: T[]) => void)(newValues);
                      }
                    } else {
                        (onChange as (value: T) => void)(option.value);
                        if(setOpen) {
                          setOpen(false);
                        }
                      }
                    }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}