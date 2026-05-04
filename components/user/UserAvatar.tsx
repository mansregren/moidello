import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

const pixelMap = { sm: 32, md: 40, lg: 56, xl: 80 };

export function UserAvatar({ src, alt, size = "md", className }: UserAvatarProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full border border-border",
        sizeMap[size],
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={pixelMap[size]}
        height={pixelMap[size]}
        className="object-cover w-full h-full"
      />
    </div>
  );
}
