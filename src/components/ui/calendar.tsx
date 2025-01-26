"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
  
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "grid grid-cols-1 gap-4", // One month at a time
        table: "grid grid-cols-7 gap-1 w-full", // Grid with 7 columns for days
        head_row: "contents", // Let the header row align properly
        head_cell:
          "text-center font-medium text-muted-foreground text-sm uppercase", // Days of the week
        row: "grid grid-cols-7 gap-1", // Ensure rows of days align properly
        cell: "h-9 w-9 text-center text-sm p-0 relative", // Proper cell sizing
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
      }}
      
      components={{
        LeftChevron: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        RightChevron: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
   
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
