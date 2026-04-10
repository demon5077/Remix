import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-[rgba(255,0,60,0.3)] bg-[rgba(139,0,0,0.25)] text-[#FF6680] hover:bg-[rgba(139,0,0,0.4)]",
        secondary:
          "border border-[rgba(124,58,237,0.3)] bg-[rgba(124,58,237,0.15)] text-[#C77DFF] hover:bg-[rgba(124,58,237,0.25)]",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:
          "border border-[rgba(255,255,255,0.1)] text-[#8888aa] hover:border-[rgba(255,0,60,0.2)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '0.6rem', letterSpacing: '0.08em' }}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
