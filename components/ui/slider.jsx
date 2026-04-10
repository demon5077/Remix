"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, trackClassName, thumbClassName, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center group", className)}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        "relative h-1 w-full grow overflow-hidden rounded-full transition-all duration-200 group-hover:h-1.5",
        trackClassName
      )}
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      <SliderPrimitive.Range
        className="absolute h-full rounded-full"
        style={{ background: 'linear-gradient(to right, #8B0000, #FF003C)' }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-3 w-3 rounded-full border-2 ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 opacity-0 group-hover:opacity-100 hover:scale-125",
        thumbClassName
      )}
      style={{
        background: '#FF003C',
        borderColor: 'rgba(255,255,255,0.3)',
        boxShadow: '0 0 8px rgba(255,0,60,0.8)',
      }}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
