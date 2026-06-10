"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    showTooltip?: boolean;
    tooltipContent?: (value: number) => React.ReactNode;
  }
>(({ className, showTooltip = false, tooltipContent, ...props }, ref) => {
  const [showTooltipState, setShowTooltipState] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<number[]>(
    (props.defaultValue as number[]) ?? (props.value as number[]) ?? [0],
  );

  React.useEffect(() => {
    if (props.value !== undefined) {
      setInternalValue(props.value as number[]);
    }
  }, [props.value]);

  const handleValueChange = (newValue: number[]) => {
    setInternalValue(newValue);
    props.onValueChange?.(newValue);
  };

  const handlePointerDown = () => {
    if (showTooltip) {
      setShowTooltipState(true);
    }
  };

  const handlePointerUp = React.useCallback(() => {
    if (showTooltip) {
      setShowTooltipState(false);
    }
  }, [showTooltip]);

  React.useEffect(() => {
    if (showTooltip) {
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("touchend", handlePointerUp);
      return () => {
        document.removeEventListener("pointerup", handlePointerUp);
        document.removeEventListener("touchend", handlePointerUp);
      };
    }
  }, [showTooltip, handlePointerUp]);

  const renderThumb = (value: number, index: number) => {
    // Determine custom color styling for thumbs (Neon Yellow for start, Amber-Orange for end)
    const thumbColors = index === 0 
      ? "border-[#bfff00] bg-neutral-950 focus-visible:outline-[#bfff00]/40" 
      : "border-amber-400 bg-neutral-950 focus-visible:outline-amber-400/40";

    const thumb = (
      <SliderPrimitive.Thumb
        className={cn(
          "block h-5 w-5 rounded-full border-2 transition-all focus-visible:outline focus-visible:outline-[3px] data-[disabled]:cursor-not-allowed cursor-grab active:cursor-grabbing hover:scale-110 active:scale-125 shadow-[0_0_10px_rgba(0,0,0,0.8)]",
          thumbColors
        )}
        onPointerDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      />
    );

    if (!showTooltip) return thumb;

    return (
      <TooltipProvider key={index}>
        <Tooltip open={showTooltipState}>
          <TooltipTrigger asChild>{thumb}</TooltipTrigger>
          <TooltipContent
            className="px-2 py-1 text-[10px] bg-neutral-950 border border-neutral-800 text-neutral-100 font-mono font-semibold select-none rounded animate-none shadow-lg"
            sideOffset={8}
            side={props.orientation === "vertical" ? "right" : "top"}
          >
            <p>{tooltipContent ? tooltipContent(value) : value}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[disabled]:opacity-50",
        className,
      )}
      onValueChange={handleValueChange}
      {...props}
    >
      <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-neutral-800 data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-1.5 border border-neutral-900">
        <SliderPrimitive.Range className="absolute bg-[#bfff00] data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
      </SliderPrimitive.Track>
      {internalValue?.map((value, index) => renderThumb(value, index))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
