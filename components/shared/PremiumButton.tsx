"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass";
  size?: "sm" | "md" | "lg";
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 ease-out",
          "active:scale-95",
          // Sizes
          size === "sm" && "px-5 py-2.5 text-sm",
          size === "md" && "px-8 py-4 text-base",
          size === "lg" && "px-10 py-5 text-lg",
          // Variants
          variant === "primary" &&
            "bg-foreground text-background hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]",
          variant === "secondary" &&
            "border border-foreground/20 bg-transparent text-foreground hover:border-foreground/40 hover:scale-[1.02]",
          variant === "glass" &&
            "glass text-foreground hover:scale-[1.02] hover:bg-foreground/10",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
PremiumButton.displayName = "PremiumButton";

export { PremiumButton };
