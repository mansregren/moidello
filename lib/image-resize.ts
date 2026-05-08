/**
 * Downscale a user-selected image so it fits within `maxBytes` and `maxDim`.
 * Returns the original file untouched if it already qualifies. Runs entirely
 * in the browser via canvas — no upload happens here.
 */
export async function resizeImageForUpload(
  file: File,
  options: { maxBytes?: number; maxDim?: number; quality?: number } = {},
): Promise<File> {
  const maxBytes = options.maxBytes ?? 5 * 1024 * 1024; // 5 MB target
  const maxDim = options.maxDim ?? 2000;
  const quality = options.quality ?? 0.85;

  // SVG and GIF are tiny / animated — leave alone.
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  if (file.size <= maxBytes) {
    const dims = await readDimensions(file);
    if (dims.width <= maxDim && dims.height <= maxDim) {
      return file;
    }
  }

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
  const targetW = Math.round(bitmap.width * ratio);
  const targetH = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  // Force JPEG to keep file size predictable (PNG of a photo blows up).
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], newName, { type: "image/jpeg" });
}

function readDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}
