"use client";

import { useState, useRef, useEffect } from "react";
import { format, parse, isValid, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value to Date object
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const isValidDate = selectedDate && isValid(selectedDate);

  // Format display value
  const displayValue = isValidDate ? format(selectedDate, "dd/MM/yyyy") : "";

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
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

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    handleDateSelect(today);
  };

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

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {/* Calendar Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {format(currentMonth, "MMMM yyyy")}
              </span>
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
          </div>

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
              const isDisabled = 
                (minDate && dayString < minDate) || 
                (maxDate && dayString > maxDate);

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
        </div>
      )}
    </div>
  );
}

