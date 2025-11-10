"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Clock, ChevronUp, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  value?: string; // HH:mm format
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  minTime?: string; // HH:mm format
  maxTime?: string; // HH:mm format
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  required = false,
  className,
  minTime,
  maxTime,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(() => {
    if (value) {
      const [h] = value.split(":");
      return parseInt(h, 10) || 0;
    }
    return new Date().getHours();
  });
  const [minutes, setMinutes] = useState(() => {
    if (value) {
      const [, m] = value.split(":");
      return parseInt(m, 10) || 0;
    }
    return new Date().getMinutes();
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; position: 'above' | 'below' } | null>(null);

  // Format display value
  const displayValue = value || "";

  // Update hours/minutes when value changes externally
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHours(parseInt(h, 10) || 0);
      setMinutes(parseInt(m, 10) || 0);
    }
  }, [value]);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 280; // Approximate height of the time picker dropdown
        const dropdownWidth = 280; // w-70 = 280px
        const spacing = 8; // mt-2 = 8px

        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        const positionAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        let top: number;
        if (positionAbove) {
          top = rect.top - dropdownHeight - spacing;
        } else {
          top = rect.bottom + spacing;
        }

        if (top < 0) {
          top = spacing;
        }
        if (top + dropdownHeight > viewportHeight) {
          top = viewportHeight - dropdownHeight - spacing;
        }

        let left = rect.left;
        if (left + dropdownWidth > window.innerWidth) {
          left = window.innerWidth - dropdownWidth - spacing;
        }
        if (left < spacing) {
          left = spacing;
        }

        setDropdownPosition({
          top,
          left,
          position: positionAbove ? 'above' : 'below'
        });
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      setTimeout(updatePosition, 0);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleHourChange = (newHour: number) => {
    if (newHour < 0) newHour = 23;
    if (newHour > 23) newHour = 0;
    setHours(newHour);
    const timeString = `${String(newHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    onChange?.(timeString);
  };

  const handleMinuteChange = (newMinute: number) => {
    if (newMinute < 0) newMinute = 59;
    if (newMinute > 59) newMinute = 0;
    setMinutes(newMinute);
    const timeString = `${String(hours).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
    onChange?.(timeString);
  };

  const handleHourIncrement = () => {
    handleHourChange(hours + 1);
  };

  const handleHourDecrement = () => {
    handleHourChange(hours - 1);
  };

  const handleMinuteIncrement = () => {
    handleMinuteChange(minutes + 1);
  };

  const handleMinuteDecrement = () => {
    handleMinuteChange(minutes - 1);
  };

  const handleTimeClick = (h: number, m: number) => {
    setHours(h);
    setMinutes(m);
    const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange?.(timeString);
    setIsOpen(false);
  };

  // Generate time options (every 15 minutes)
  const timeOptions: Array<{ hour: number; minute: number; label: string }> = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? 'AM' : 'PM';
      timeOptions.push({
        hour: h,
        minute: m,
        label: `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
      });
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white cursor-pointer transition-colors",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:border-sky-500 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500"
        )}
      >
        <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          readOnly
          className="flex-1 bg-transparent border-none outline-none cursor-pointer"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange?.("");
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && !disabled && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-[280px] rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <div className="p-4">
            {/* Time selector with increment/decrement buttons */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleHourIncrement}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="text-3xl font-bold text-gray-900 dark:text-white min-w-[60px] text-center py-2">
                  {String(hours).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={handleHourDecrement}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hours</div>
              </div>

              <div className="text-3xl font-bold text-gray-900 dark:text-white">:</div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleMinuteIncrement}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="text-3xl font-bold text-gray-900 dark:text-white min-w-[60px] text-center py-2">
                  {String(minutes).padStart(2, '0')}
                </div>
                <button
                  type="button"
                  onClick={handleMinuteDecrement}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minutes</div>
              </div>
            </div>

            {/* Quick time selection grid */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Select</div>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {timeOptions.map((option) => {
                  const isSelected = option.hour === hours && option.minute === minutes;
                  return (
                    <button
                      key={`${option.hour}-${option.minute}`}
                      type="button"
                      onClick={() => handleTimeClick(option.hour, option.minute)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-md transition-colors",
                        isSelected
                          ? "bg-sky-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

