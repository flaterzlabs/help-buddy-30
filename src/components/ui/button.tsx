import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-gentle focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground shadow-soft hover:shadow-medium hover:scale-[1.02]",
        destructive: "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90 hover:shadow-medium",
        outline: "border-2 border-border bg-card/50 text-foreground shadow-soft hover:bg-accent hover:shadow-medium",
        secondary: "bg-gradient-secondary text-secondary-foreground shadow-soft hover:shadow-medium hover:scale-[1.02]",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg",
        link: "text-primary underline-offset-4 hover:underline",
        // Variantes específicas para Help Buddy
        help: "bg-gradient-warm text-warning-foreground shadow-large hover:shadow-large hover:scale-105 animate-gentle-pulse border-4 border-warning/30",
        role: "bg-card text-card-foreground border-2 border-primary/20 shadow-medium hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-large transition-bounce",
        buddy: "bg-gradient-accent text-accent-foreground shadow-soft hover:shadow-medium hover:scale-[1.05] rounded-2xl"
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-16 px-8 py-4 text-lg font-semibold",
        xl: "h-20 px-12 py-6 text-xl font-bold",
        icon: "h-12 w-12",
        // Tamanhos específicos para acessibilidade
        help: "h-24 px-16 py-8 text-help-button font-bold min-w-[200px]",
        role: "h-20 px-8 py-6 text-lg font-semibold min-w-[160px]"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
