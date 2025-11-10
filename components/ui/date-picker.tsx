"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { format, parse, isValid, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addYears, subYears, isToday, setMonth, setYear } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, X, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  minDate?: string; // YYYY-MM-DD format
  maxDate?: string; // YYYY-MM-DD format
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  required = false,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const date = parse(value, "yyyy-MM-dd", new Date());
      return isValid(date) ? date : new Date();
    }
    return new Date();
  });
  const [viewMode, setViewMode] = useState<'calendar' | 'year' | 'month'>('calendar');
  const [yearRange, setYearRange] = useState(() => {
    const currentYear = new Date().getFullYear();
    return { start: currentYear - 12, end: currentYear + 12 };
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; position: 'above' | 'below' } | null>(null);

  // Parse value to Date object
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const isValidDate = selectedDate && isValid(selectedDate);

  // Format display value
  const displayValue = isValidDate ? format(selectedDate, "dd/MM/yyyy") : "";

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownHeight = 400; // Approximate height of the calendar dropdown
        const dropdownWidth = 320; // w-80 = 320px
        const spacing = 8; // mt-2 = 8px

        // Calculate available space below and above
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Determine if dropdown should be above or below
        // Position above if there's not enough space below AND more space above
        const positionAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        // Calculate vertical position
        let top: number;
        if (positionAbove) {
          top = rect.top - dropdownHeight - spacing;
        } else {
          top = rect.bottom + spacing;
        }

        // Ensure dropdown doesn't go above viewport
        if (top < 0) {
          top = spacing;
        }

        // Ensure dropdown doesn't go below viewport
        if (top + dropdownHeight > viewportHeight) {
          top = viewportHeight - dropdownHeight - spacing;
        }

        // Calculate horizontal position (center aligned with input, but adjust if needed)
        let left = rect.left;
        
        // If dropdown would overflow on the right, align to right edge of viewport
        if (left + dropdownWidth > viewportWidth) {
          left = viewportWidth - dropdownWidth - spacing;
        }
        
        // If dropdown would overflow on the left, align to left edge
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
      
      // Update position on scroll and resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      // Small delay to ensure DOM is ready
      setTimeout(updatePosition, 0);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a small delay to prevent immediate closure
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Update current month when value changes
  useEffect(() => {
    if (value) {
      const date = parse(value, "yyyy-MM-dd", new Date());
      if (isValid(date)) {
        setCurrentMonth(date);
      }
    }
  }, [value]);

  // Reset view mode when calendar closes
  useEffect(() => {
    if (!isOpen) {
      setViewMode('calendar');
    }
  }, [isOpen]);

  const handleDateSelect = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    
    // Check min/max constraints
    if (minDate && dateString < minDate) return;
    if (maxDate && dateString > maxDate) return;

    onChange?.(dateString);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToPreviousYear = () => {
    setCurrentMonth(subYears(currentMonth, 1));
  };

  const goToNextYear = () => {
    setCurrentMonth(addYears(currentMonth, 1));
  };

  const goToPreviousYearRange = () => {
    setYearRange(prev => ({ start: prev.start - 25, end: prev.end - 25 }));
  };

  const goToNextYearRange = () => {
    setYearRange(prev => ({ start: prev.start + 25, end: prev.end + 25 }));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setViewMode('calendar');
    handleDateSelect(today);
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(setMonth(currentMonth, month));
    setViewMode('calendar');
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(setYear(currentMonth, year));
    setViewMode('calendar');
  };

  const handleMonthYearClick = () => {
    setViewMode('month');
  };

  const handleYearClick = () => {
    const currentYear = currentMonth.getFullYear();
    setYearRange({ start: currentYear - 12, end: currentYear + 12 });
    setViewMode('year');
  };

  // Generate years for year picker
  const generateYears = () => {
    const years = [];
    for (let year = yearRange.start; year <= yearRange.end; year++) {
      years.push(year);
    }
    return years;
  };

  // Generate months
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm",
          "ring-offset-white placeholder:text-gray-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-gray-700 dark:bg-gray-900 dark:ring-offset-gray-950 dark:placeholder:text-gray-400",
          isOpen && "ring-2 ring-sky-500",
          disabled && "cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            readOnly
            value={displayValue}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="flex-1 bg-transparent outline-none cursor-pointer"
          />
        </div>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && !disabled && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-80 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            {viewMode === 'calendar' && (
              <>
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMonthYearClick}
                    className="font-semibold text-gray-900 hover:text-sky-600 dark:text-white dark:hover:text-sky-400"
                  >
                    {format(currentMonth, "MMMM yyyy")}
                  </button>
                  <button
                    type="button"
                    onClick={goToToday}
                    className="rounded-lg px-2 py-1 text-xs text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/30"
                  >
                    Today
                  </button>
                </div>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </>
            )}
            {viewMode === 'month' && (
              <>
                <button
                  type="button"
                  onClick={handleYearClick}
                  className="font-semibold text-gray-900 hover:text-sky-600 dark:text-white dark:hover:text-sky-400"
                >
                  {format(currentMonth, "yyyy")}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className="rounded-lg px-2 py-1 text-xs text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/30"
                >
                  Back
                </button>
              </>
            )}
            {viewMode === 'year' && (
              <>
                <button
                  type="button"
                  onClick={goToPreviousYearRange}
                  className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronsLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {yearRange.start} - {yearRange.end}
                </span>
                <button
                  type="button"
                  onClick={goToNextYearRange}
                  className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ChevronsRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </>
            )}
          </div>

          {viewMode === 'calendar' && (
            <>
              {/* Week Days Header */}
              <div className="grid grid-cols-7 gap-1 border-b border-gray-200 p-2 dark:border-gray-700">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="flex items-center justify-center p-2 text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 p-2">
                {days.map((day, dayIdx) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = isValidDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);
                  const dayString = format(day, "yyyy-MM-dd");
                  const isDisabled = Boolean(
                    (minDate && dayString < minDate) || 
                    (maxDate && dayString > maxDate)
                  );

                  return (
                    <button
                      key={dayIdx}
                      type="button"
                      onClick={() => !isDisabled && handleDateSelect(day)}
                      disabled={isDisabled}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors",
                        !isCurrentMonth && "text-gray-300 dark:text-gray-600",
                        isCurrentMonth && !isSelected && !isTodayDate && "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                        isTodayDate && !isSelected && "bg-sky-50 font-semibold text-sky-600 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400",
                        isSelected && "bg-sky-500 font-semibold text-white hover:bg-sky-600",
                        isDisabled && "cursor-not-allowed opacity-50",
                        !isDisabled && "cursor-pointer"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === 'month' && (
            <div className="grid grid-cols-3 gap-2 p-4">
              {months.map((month, index) => {
                const isCurrentMonthSelected = currentMonth.getMonth() === index;
                return (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleMonthSelect(index)}
                    className={cn(
                      "rounded-lg py-2 px-3 text-sm font-medium transition-colors",
                      isCurrentMonthSelected
                        ? "bg-sky-500 text-white hover:bg-sky-600"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          )}

          {viewMode === 'year' && (
            <div className="grid grid-cols-5 gap-2 p-4 max-h-64 overflow-y-auto">
              {generateYears().map((year) => {
                const isCurrentYearSelected = currentMonth.getFullYear() === year;
                const isCurrentYear = new Date().getFullYear() === year;
                return (
                  <button
                    key={year}
                    type="button"
                    onClick={() => handleYearSelect(year)}
                    className={cn(
                      "rounded-lg py-2 px-3 text-sm font-medium transition-colors",
                      isCurrentYearSelected
                        ? "bg-sky-500 text-white hover:bg-sky-600"
                        : isCurrentYear
                        ? "bg-sky-50 font-semibold text-sky-600 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

