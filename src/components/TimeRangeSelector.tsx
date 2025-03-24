import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import { DateRange } from "react-day-picker";
import { TimeRange } from "@/types/time";

type TimeRangeSelectorProps = {
  start: number; // Changed from Date to number (timestamp)
  end: number; // Changed from Date to number (timestamp)
  value: string;
  onRangeChange: (range: TimeRange) => void;
};

export default function TimeRangeSelector({
  start,
  end,
  value,
  onRangeChange,
}: TimeRangeSelectorProps) {
  const dateRange: DateRange = {
    from: new Date(start), // Convert timestamp to Date
    to: new Date(end), // Convert timestamp to Date
  };

  const presets = {
    today: {
      label: "Today",
      range: () => ({
        start: new Date(),
        end: new Date(),
      }),
    },
    yesterday: {
      label: "Yesterday",
      range: () => ({
        start: subDays(new Date(), 1),
        end: subDays(new Date(), 1),
      }),
    },
    thisWeek: {
      label: "This Week",
      range: () => ({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 }),
      }),
    },
    lastWeek: {
      label: "Last Week",
      range: () => {
        const start = startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 });
        const end = endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 });
        return { start, end };
      },
    },
    thisMonth: {
      label: "This Month",
      range: () => ({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      }),
    },
    lastMonth: {
      label: "Last Month",
      range: () => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
        };
      },
    },
    custom: {
      label: "Custom Range",
      range: () => ({
        start: dateRange?.from || new Date(),
        end: dateRange?.to || new Date(),
      }),
    },
  };

  const handlePresetChange = (value: string) => {
    const preset = presets[value as keyof typeof presets];
    const { start: newStart, end: newEnd } = preset.range();

    onRangeChange({
      start: newStart.getTime(),
      end: newEnd.getTime(),
      value,
    });
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return;

    onRangeChange({
      start: range.from.getTime(),
      end: range.to.getTime(),
      value: "custom",
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Select value={value} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="thisWeek">This Week</SelectItem>
          <SelectItem value="lastWeek">Last Week</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="lastMonth">Last Month</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM d, yyyy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
