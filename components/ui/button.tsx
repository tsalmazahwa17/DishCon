import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold transition-all focus-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-brand-700 text-white shadow-lg shadow-brand-700/20 hover:bg-brand-800",
        secondary: "border border-stone-200 bg-white text-ink hover:bg-stone-50",
        ghost: "text-stone-700 hover:bg-brand-50 hover:text-brand-700",
        soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
        outline: "border border-brand-700 bg-transparent text-brand-700 hover:bg-brand-50",
        destructive: "bg-red-600 text-white hover:bg-red-700"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3",
        lg: "h-[52px] px-7 py-4",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
