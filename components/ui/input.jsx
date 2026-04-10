import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        className
      )}
      style={{
        background: 'rgba(18,18,32,0.8)',
        borderColor: 'rgba(255,0,60,0.1)',
        color: '#ccccee',
        fontFamily: 'Rajdhani, sans-serif',
        letterSpacing: '0.02em',
      }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(255,0,60,0.4)';
        e.target.style.boxShadow = '0 0 0 2px rgba(255,0,60,0.1), 0 0 12px rgba(255,0,60,0.06)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(255,0,60,0.1)';
        e.target.style.boxShadow = 'none';
      }}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
