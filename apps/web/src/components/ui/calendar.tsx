/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react";
import {
  DayFlag,
  DayPicker,
  SelectionState,
  UI,
  type DropdownProps,
} from "react-day-picker";

import { cn } from "~/lib/utils";
import { buttonVariants } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface CalendarLocale {
  weekdayNames: string[];
  monthNames: string[];
}

const CALENDAR_LOCALES: Record<string, CalendarLocale> = {
  "en-US": {
    weekdayNames: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    monthNames: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  },
  "pt-BR": {
    weekdayNames: [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ],
    monthNames: [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ],
  },
};

const getCalendarLocale = (locale = "en-US"): CalendarLocale => {
  return CALENDAR_LOCALES[locale] || CALENDAR_LOCALES["en-US"];
};

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  customLocale?: string;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  customLocale = "en-US",
  ...restProps
}: CalendarProps): React.JSX.Element {
  const calendarLocale = getCalendarLocale(customLocale);
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 xl:p-3", className)}
      formatters={{
        formatCaption: (date) =>
          `${calendarLocale.monthNames[date.getMonth()]} ${date.getFullYear()}`,
        formatWeekdayName: (date) => {
          // In react-day-picker v9, formatWeekdayName receives the date and options
          // The date is the first visible day in that column
          // We need to map the date's day of week to the correct column index
          // Since weekStartsOn={0} (Sunday), we can use getDay() directly
          // But we need to ensure we're using the correct weekday for the column
          const dayOfWeek = date.getDay();
          // Map dayOfWeek (0=Sunday, 1=Monday, etc.) to our weekdayNames array
          return calendarLocale.weekdayNames[dayOfWeek].substring(0, 2);
        },
      }}
      weekStartsOn={0}
      classNames={{
        [UI.Months]: "relative flex flex-col sm:flex-row gap-4",
        [UI.Month]: "space-y-4",
        [UI.MonthCaption]: "flex justify-center items-center h-10 relative",
        [UI.CaptionLabel]: "text-sm font-medium",
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "left-1  z-10 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: "outline" }),
          "right-1  z-10 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        [UI.MonthGrid]: "w-full border-collapse space-y-1",
        [UI.Weekdays]: "flex",
        [UI.Weekday]:
          "text-muted-foreground rounded-md w-7 xl:w-8 font-normal text-[0.8rem]",
        [UI.Week]: "flex w-full mt-2",
        [UI.Nav]:
          "absolute left-0 right-0 top-0 h-10 flex items-center justify-between",
        [UI.Day]: cn(
          "relative h-7 w-7 xl:h-8 xl:w-8 p-0 text-center text-sm",
          "focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-accent",
          "first:[&:has([aria-selected])]:rounded-l-md",
          "last:[&:has([aria-selected])]:rounded-r-md",
        ),
        [UI.DayButton]: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 xl:h-8 xl:w-8 p-0 font-normal aria-selected:opacity-100",
        ),
        [UI.Dropdowns]: "flex items-center gap-1",
        [SelectionState.range_end]: "day-range-end",
        [SelectionState.selected]: cn(
          "bg-primary text-primary-foreground rounded-md",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
        ),
        [SelectionState.range_middle]: cn(
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        ),
        [DayFlag.today]: "bg-accent text-accent-foreground rounded-md",
        [DayFlag.outside]: cn(
          "day-outside text-muted-foreground opacity-50",
          "aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          "aria-selected:opacity-30",
        ),
        [DayFlag.disabled]: "text-muted-foreground opacity-50",
        [DayFlag.hidden]: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation = "left" }) => {
          switch (orientation) {
            case "left":
              return <ChevronLeftIcon className="h-4 w-4" />;
            case "right":
              return <ChevronRightIcon className="h-4 w-4" />;
            case "up":
              return <ChevronUpIcon className="h-4 w-4" />;
            case "down":
              return <ChevronDownIcon className="h-4 w-4" />;
            default:
              return <ChevronLeftIcon className="h-4 w-4" />;
          }
        },
        Dropdown: ({ value, onChange, ...props }: DropdownProps) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
          const selected = props.options?.find(
            (option) => option.value === value,
          );
          const handleChange = (value: string) => {
            const changeEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLSelectElement>;
            onChange?.(changeEvent);
          };

          return (
            <Select value={value?.toString()} onValueChange={handleChange}>
              <SelectTrigger className="pr-1.5 focus:ring-0">
                {}
                <SelectValue>{selected?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper">
                {/* eslint-disable-next-line @typescript-eslint/no-unsafe-call */}
                {props.options?.map((option, id: number) => {
                  const optionValue = option.value as string | number;

                  const optionLabel = option.label as string;
                  return (
                    <SelectItem
                      key={`${optionValue}-${id}`}
                      value={optionValue?.toString() ?? ""}
                    >
                      {optionLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          );
        },
      }}
      {...restProps}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
