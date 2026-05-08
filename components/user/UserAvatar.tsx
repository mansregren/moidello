import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

const pixelMap = { sm: 32, md: 40, lg: 56, xl: 80 };

function initials(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "?";
  // Take first letter of up to two whitespace-separated tokens
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function UserAvatar({ src, alt, size = "md", className }: UserAvatarProps) {
  const trimmed = (src ?? "").trim();
  const hasImage = trimmed.length > 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border border-border bg-background-tertiary flex items-center justify-center font-semibold text-foreground-muted shrink-0",
        sizeMap[size],
        className,
      )}
      aria-label={alt}
    >
      {hasImage ? (
        <Image
          src={trimmed}
          alt={alt}
          width={pixelMap[size]}
          height={pixelMap[size]}
          className="object-cover w-full h-full"
          unoptimized={trimmed.startsWith("http")}
        />
      ) : (
        <span aria-hidden="true">{initials(alt)}</span>
      )}
    </div>
  );
}
