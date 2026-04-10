import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-crimson to-hellfire text-white shadow-glow-red hover:shadow-[0_0_28px_rgba(255,0,60,0.55)] hover:brightness-110",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-[rgba(255,0,60,0.2)] bg-transparent text-foreground hover:bg-[rgba(255,0,60,0.08)] hover:border-[rgba(255,0,60,0.4)]",
        secondary:
          "bg-[rgba(18,18,32,0.9)] text-[#ccccee] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(24,24,40,0.95)] hover:border-[rgba(255,0,60,0.15)]",
        ghost:
          "hover:bg-[rgba(255,0,60,0.08)] hover:text-[#FF003C] text-[#8888aa]",
        link:
          "text-[#FF003C] underline-offset-4 hover:underline p-0 h-auto",
        shine:
          "text-white animate-shine bg-gradient-to-r from-crimson via-hellfire/75 to-crimson bg-[length:400%_100%]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-12 rounded-xl px-8 text-base",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, Icon, iconPlacement, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {Icon && iconPlacement === "left" && (
          <div className="w-0 translate-x-[0%] pr-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:pr-2 group-hover:opacity-100">
            <Icon />
          </div>
        )}
        <Slottable>{props.children}</Slottable>
        {Icon && iconPlacement === "right" && (
          <div className="w-0 translate-x-[100%] pl-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:pl-2 group-hover:opacity-100">
            <Icon />
          </div>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
