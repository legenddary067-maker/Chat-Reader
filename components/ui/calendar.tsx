"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}: CalendarProps) {
  const defaultClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4",
    month: "w-full",
    month_caption: "relative mx-10 mb-1 flex h-9 items-center justify-center z-20",
    caption_label: "text-sm font-medium text-neutral-200",
    nav: "absolute top-0 flex w-full justify-between z-10",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-neutral-400 hover:text-[#bfff00] p-0"
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-neutral-400 hover:text-[#bfff00] p-0"
    ),
    weekday: "size-9 p-0 text-xs font-medium text-neutral-500",
    day_button:
      "relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg p-0 text-neutral-300 outline-offset-2 hover:bg-neutral-900 group-data-[selected]:bg-[#bfff00] group-data-[selected]:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#bfff00]/70",
    day: "group size-9 px-0 text-sm",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-[#bfff00] [&[data-selected]:not(.range-middle)>*]:after:bg-black",
    outside: "text-neutral-600 data-selected:bg-neutral-800 data-selected:text-neutral-400",
    hidden: "invisible",
    week_number: "size-9 p-0 text-xs font-medium text-neutral-500",
  };

  const mergedClassNames: typeof defaultClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key as keyof typeof classNames]
        ? cn(
            defaultClassNames[key as keyof typeof defaultClassNames],
            classNames[key as keyof typeof classNames],
          )
        : defaultClassNames[key as keyof typeof defaultClassNames],
    }),
    {} as typeof defaultClassNames,
  );

  const defaultComponents = {
    Chevron: (props: any) => {
      if (props.orientation === "left") {
        return <ChevronLeft size={16} strokeWidth={2} {...props} aria-hidden="true" />;
      }
      return <ChevronRight size={16} strokeWidth={2} {...props} aria-hidden="true" />;
    },
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit p-3 bg-neutral-950 border border-neutral-900 rounded-none shadow-xl", className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
