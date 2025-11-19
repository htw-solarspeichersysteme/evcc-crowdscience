import React, { useEffect, useRef } from "react";

interface DateInputProps {
  value?: Date;
  onChange: (date: Date) => void;
  onBlur?: (validatedDate: Date) => void;
  locale?: string;
  minDate?: Date;
  maxDate?: Date;
}

interface DateParts {
  day: number;
  month: number;
  year: number;
}

// Helper function to determine if locale uses DD/MM/YYYY format
const usesDayMonthYear = (locale: string): boolean => {
  // Locales that typically use DD/MM/YYYY format
  const dayFirstLocales = [
    "pt-BR",
    "pt-PT",
    "en-GB",
    "en-AU",
    "fr-FR",
    "de-DE",
    "es-ES",
    "it-IT",
    "nl-NL",
    "sv-SE",
    "da-DK",
    "nb-NO",
  ];
  return dayFirstLocales.some(
    (l) => locale.startsWith(l.split("-")[0]) && locale !== "en-US",
  );
};

const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  onBlur,
  locale = "en-US",
  minDate,
  maxDate,
}) => {
  const isDayFirst = usesDayMonthYear(locale);
  const [date, setDate] = React.useState<DateParts>(() => {
    const d = value ? new Date(value) : new Date();
    return {
      day: d.getDate(),
      month: d.getMonth() + 1, // JavaScript months are 0-indexed
      year: d.getFullYear(),
    };
  });

  const monthRef = useRef<HTMLInputElement | null>(null);
  const dayRef = useRef<HTMLInputElement | null>(null);
  const yearRef = useRef<HTMLInputElement | null>(null);
  const isEditingRef = useRef<boolean>(false);

  useEffect(() => {
    // Don't sync with parent value while user is actively editing
    if (isEditingRef.current) return;

    const d = value ? new Date(value) : new Date();
    setDate({
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }, [value]);

  const validateDate = (field: keyof DateParts, value: number): boolean => {
    if (
      (field === "day" && (value < 1 || value > 31)) ||
      (field === "month" && (value < 1 || value > 12)) ||
      (field === "year" && (value < 1000 || value > 9999))
    ) {
      return false;
    }

    // Validate the day of the month
    const newDate = { ...date, [field]: value };
    const d = new Date(newDate.year, newDate.month - 1, newDate.day);
    return (
      d.getFullYear() === newDate.year &&
      d.getMonth() + 1 === newDate.month &&
      d.getDate() === newDate.day
    );
  };

  const handleInputChange =
    (field: keyof DateParts) => (e: React.ChangeEvent<HTMLInputElement>) => {
      // Mark that user is actively editing
      isEditingRef.current = true;

      const inputValue = e.target.value;

      // Option 2: Allow any numeric input during typing, validate only on blur
      // Accept empty input or any valid number format
      if (inputValue === "" || /^\d+$/.test(inputValue)) {
        const newValue = inputValue === "" ? 0 : Number(inputValue);

        // Update state immediately without validation
        const newDate = { ...date, [field]: newValue };
        setDate(newDate);

        // Try to create a valid date and notify parent if successful
        try {
          const tentativeDate = new Date(
            newDate.year,
            newDate.month - 1,
            newDate.day,
          );

          // Fix Issue 2: Verify date wasn't auto-corrected by JavaScript (e.g., Nov 31 → Dec 1)
          const isDateCorrect =
            tentativeDate.getFullYear() === newDate.year &&
            tentativeDate.getMonth() + 1 === newDate.month &&
            tentativeDate.getDate() === newDate.day;

          // Fix Issue 3: Validate year is within reasonable range (1000-9999)
          // Prevents partial years (2, 20, 202) from corrupting date range
          const hasReasonableYear =
            newDate.year >= 1000 && newDate.year <= 9999;

          // Only notify parent if date is valid, not auto-corrected, AND has reasonable year
          if (
            !isNaN(tentativeDate.getTime()) &&
            isDateCorrect &&
            hasReasonableYear
          ) {
            onChange(tentativeDate);
          }
        } catch {
          // Ignore errors during intermediate states
        }
      }
    };

  const initialDate = useRef<DateParts>(date);

  const handleBlur =
    (field: keyof DateParts) =>
    (e: React.FocusEvent<HTMLInputElement>): void => {
      // User finished editing, allow parent sync again
      isEditingRef.current = false;

      if (!e.target.value) {
        setDate(initialDate.current);
        // Notify parent when reverting to initial date
        const revertedDate = new Date(
          initialDate.current.year,
          initialDate.current.month - 1,
          initialDate.current.day,
        );
        onChange(revertedDate);
        onBlur?.(revertedDate);
        return;
      }

      const newValue = Number(e.target.value);
      const isValid = validateDate(field, newValue);

      if (!isValid) {
        setDate(initialDate.current);
        // Notify parent when reverting to initial date
        const revertedDate = new Date(
          initialDate.current.year,
          initialDate.current.month - 1,
          initialDate.current.day,
        );
        onChange(revertedDate);
        onBlur?.(revertedDate);
      } else {
        // If the new value is valid, update the initial value
        initialDate.current = { ...date, [field]: newValue };

        // Validate against min/max date boundaries
        const newDate = { ...date, [field]: newValue };
        const finalDate = new Date(
          newDate.year,
          newDate.month - 1,
          newDate.day,
        );

        // Clamp date to valid range
        let clampedDate = finalDate;
        if (minDate && finalDate < minDate) {
          clampedDate = minDate;
        } else if (maxDate && finalDate > maxDate) {
          clampedDate = maxDate;
        }

        // If date was clamped, update state and notify parent
        if (clampedDate.getTime() !== finalDate.getTime()) {
          const clampedParts = {
            day: clampedDate.getDate(),
            month: clampedDate.getMonth() + 1,
            year: clampedDate.getFullYear(),
          };
          setDate(clampedParts);
          initialDate.current = clampedParts;
          onChange(clampedDate);
          onBlur?.(clampedDate);
        } else {
          // Date was valid and not clamped
          onBlur?.(finalDate);
        }
      }
    };

  const handleKeyDown =
    (field: keyof DateParts) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow command (or control) combinations
      if (e.metaKey || e.ctrlKey) {
        return;
      }

      // Prevent non-numeric characters, excluding allowed keys
      if (
        !/^[0-9]$/.test(e.key) &&
        ![
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Delete",
          "Tab",
          "Backspace",
          "Enter",
        ].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        let newDate = { ...date };

        if (field === "day") {
          if (date[field] === new Date(date.year, date.month, 0).getDate()) {
            newDate = { ...newDate, day: 1, month: (date.month % 12) + 1 };
            if (newDate.month === 1) newDate.year += 1;
          } else {
            newDate.day += 1;
          }
        }

        if (field === "month") {
          if (date[field] === 12) {
            newDate = { ...newDate, month: 1, year: date.year + 1 };
          } else {
            newDate.month += 1;
          }
        }

        if (field === "year") {
          newDate.year += 1;
        }

        setDate(newDate);
        onChange(new Date(newDate.year, newDate.month - 1, newDate.day));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        let newDate = { ...date };

        if (field === "day") {
          if (date[field] === 1) {
            newDate.month -= 1;
            if (newDate.month === 0) {
              newDate.month = 12;
              newDate.year -= 1;
            }
            newDate.day = new Date(newDate.year, newDate.month, 0).getDate();
          } else {
            newDate.day -= 1;
          }
        }

        if (field === "month") {
          if (date[field] === 1) {
            newDate = { ...newDate, month: 12, year: date.year - 1 };
          } else {
            newDate.month -= 1;
          }
        }

        if (field === "year") {
          newDate.year -= 1;
        }

        setDate(newDate);
        onChange(new Date(newDate.year, newDate.month - 1, newDate.day));
      }

      if (e.key === "ArrowRight") {
        if (
          e.currentTarget.selectionStart === e.currentTarget.value.length ||
          (e.currentTarget.selectionStart === 0 &&
            e.currentTarget.selectionEnd === e.currentTarget.value.length)
        ) {
          e.preventDefault();
          if (isDayFirst) {
            if (field === "day") monthRef.current?.focus();
            if (field === "month") yearRef.current?.focus();
          } else {
            if (field === "month") dayRef.current?.focus();
            if (field === "day") yearRef.current?.focus();
          }
        }
      } else if (e.key === "ArrowLeft") {
        if (
          e.currentTarget.selectionStart === 0 ||
          (e.currentTarget.selectionStart === 0 &&
            e.currentTarget.selectionEnd === e.currentTarget.value.length)
        ) {
          e.preventDefault();
          if (isDayFirst) {
            if (field === "month") dayRef.current?.focus();
            if (field === "year") monthRef.current?.focus();
          } else {
            if (field === "day") monthRef.current?.focus();
            if (field === "year") dayRef.current?.focus();
          }
        }
      }
    };

  const dayInput = (
    <input
      type="text"
      ref={dayRef}
      max={31}
      maxLength={2}
      value={date.day.toString()}
      onChange={handleInputChange("day")}
      onKeyDown={handleKeyDown("day")}
      onFocus={(e) => {
        if (window.innerWidth > 1024) {
          e.target.select();
        }
      }}
      onBlur={handleBlur("day")}
      className="w-7 border-none bg-transparent p-0 text-center text-foreground outline-none placeholder:text-muted-foreground focus:outline-none"
      placeholder="D"
    />
  );

  const monthInput = (
    <input
      type="text"
      ref={monthRef}
      max={12}
      maxLength={2}
      value={date.month.toString()}
      onChange={handleInputChange("month")}
      onKeyDown={handleKeyDown("month")}
      onFocus={(e) => {
        if (window.innerWidth > 1024) {
          e.target.select();
        }
      }}
      onBlur={handleBlur("month")}
      className="w-6 border-none bg-transparent p-0 text-center text-foreground outline-none placeholder:text-muted-foreground focus:outline-none"
      placeholder="M"
    />
  );

  const yearInput = (
    <input
      type="text"
      ref={yearRef}
      max={9999}
      maxLength={4}
      value={date.year.toString()}
      onChange={handleInputChange("year")}
      onKeyDown={handleKeyDown("year")}
      onFocus={(e) => {
        if (window.innerWidth > 1024) {
          e.target.select();
        }
      }}
      onBlur={handleBlur("year")}
      className="w-12 border-none bg-transparent p-0 text-center text-foreground outline-none placeholder:text-muted-foreground focus:outline-none"
      placeholder="YYYY"
    />
  );

  return (
    <div className="flex items-center rounded-lg border border-border bg-card/50 px-2 py-1 text-sm text-foreground transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 hover:border-primary/50">
      {isDayFirst ? (
        <>
          {dayInput}
          <span className="-mx-px text-xs font-medium text-muted-foreground/70">
            /
          </span>
          {monthInput}
          <span className="-mx-px text-xs font-medium text-muted-foreground/70">
            /
          </span>
          {yearInput}
        </>
      ) : (
        <>
          {monthInput}
          <span className="-mx-px text-xs font-medium text-muted-foreground/70">
            /
          </span>
          {dayInput}
          <span className="-mx-px text-xs font-medium text-muted-foreground/70">
            /
          </span>
          {yearInput}
        </>
      )}
    </div>
  );
};

DateInput.displayName = "DateInput";

export { DateInput };
