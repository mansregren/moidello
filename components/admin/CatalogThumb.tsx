/* eslint-disable @next/next/no-img-element -- storage images, already sized */

/**
 * A plaggbank photo shown the way the flatlay builder will draw it: on its
 * own studio colour (white for transparent/white shots), contain-fitted.
 */
export function CatalogThumb({
  src,
  bg,
  alt,
  className = "",
}: {
  src: string;
  bg: string | null;
  alt: string;
  className?: string;
}) {
  const fill = !bg || bg === "transparent" ? "#ffffff" : bg;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: fill }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        className={`absolute inset-0 h-full w-full p-[6%] ${
          bg === null ? "object-cover p-0" : "object-contain"
        }`}
      />
    </div>
  );
}
