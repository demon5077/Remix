import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("remix-shimmer rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
