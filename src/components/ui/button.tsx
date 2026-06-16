import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-white hover:bg-primary/90 hover:shadow-md',
        accent:
          'bg-accent text-primary hover:bg-accent/90 hover:shadow-md hover:shadow-accent/20',
        destructive:
          'bg-danger text-white hover:bg-danger/90 hover:shadow-md hover:shadow-danger/20',
        outline:
          'border-2 border-input bg-white hover:border-primary/40 hover:bg-primary/5 hover:text-primary shadow-none',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-primary/8 hover:text-primary shadow-none',
        link:
          'text-primary underline-offset-4 hover:underline shadow-none',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 px-8 text-base',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
