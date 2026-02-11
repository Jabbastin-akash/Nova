"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type GlassVariant = "default" | "blue" | "orange" | "teal";
type GlassSize = "sm" | "md" | "lg" | "xl";

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassVariant;
  size?: GlassSize;
  /** Optional icon rendered before the label */
  icon?: React.ReactNode;
  /** Render as a child slot (passthrough) */
  asChild?: boolean;
}

const variantClasses: Record<GlassVariant, string> = {
  default: "btn-glass",
  blue: "btn-glass-blue",
  orange: "btn-glass-orange",
  teal: "btn-glass-teal",
};

const sizeClasses: Record<GlassSize, string> = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-11 px-6 text-sm rounded-xl",
  lg: "h-14 px-8 text-base rounded-2xl",
  xl: "h-16 px-10 text-lg rounded-2xl",
};

/**
 * GlassButton — A premium liquid glass button component.
 *
 * Features:
 * - Semi-transparent background with backdrop blur
 * - Soft glowing border on hover
 * - Subtle lift + scale animation on hover
 * - Multiple color variants: default, blue, orange, teal
 * - Fully accessible with focus-visible ring
 * - Responsive sizing
 *
 * @example
 * ```tsx
 * <GlassButton variant="blue" size="lg">
 *   Get Started
 * </GlassButton>
 *
 * <GlassButton variant="teal" icon={<Sparkles />}>
 *   Analyze
 * </GlassButton>
 * ```
 */
const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2.5 font-semibold text-white",
          "transition-all duration-300 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-40",
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0 [&_svg]:size-5">{icon}</span>}
        {children}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton };
