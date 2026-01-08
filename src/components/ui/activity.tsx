import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const activityVariants = cva(
  'rounded-full p-2 transition-all',
  {
    variants: {
      default: 'bg-gray-100 text-gray-600',
      active: 'bg-green-100 text-green-600',
      inactive: 'bg-gray-100 text-gray-600',
      pulse: 'animate-pulse',
    },
    sizes: {
      default: 'h-5 w-5',
      sm: 'h-4 w-4',
      lg: 'h-6 w-6',
    },
  },
);

export interface ActivityProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof activityVariants>['variant'];
  size?: VariantProps<typeof activityVariants>['size'];
  pulse?: boolean;
}

function Activity({ className, variant = 'default', size = 'default', pulse = false, ...props }: ActivityProps) {
  const variantClass = pulse ? 'pulse' : variant;
  return <div className={cn(activityVariants({ variant: variantClass, size }), className)} {...props} />;
}

export { Activity, activityVariants };
