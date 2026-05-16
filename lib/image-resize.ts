// Outfit-bilden visas i en aspect-[3/4]-ruta på /skapa och i en 8:11
// cover-ruta på outfit-detail-sidan. Padd till 3:4 med kräm-bg gör att
// hela Pinterest-motivet får plats utan crop, och paddningen smälter in
// i sajt-bakgrunden (#F7F6F3) så det inte syns på publika sidor.
const TARGET_ASPECT = 3 / 4; // bredd / höjd (portrait)
const PAD_COLOR = "#F7F6F3";

/**
 * Downscale + pad a user-selected image to a 3:4 portrait canvas. Pinterest
 * downloads ofta i 2:3, 9:16 eller landscape — utan paddningen tappar
 * outfit-vyn topp/botten eller sidor. Runs entirely in the browser via
 * canvas — no upload happens here.
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

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
  const drawW = Math.round(bitmap.width * ratio);
  const drawH = Math.round(bitmap.height * ratio);

  // Bestäm canvas-storlek så hela bilden ryms i 3:4 — utöka kortsidan.
  const imgAspect = drawW / drawH;
  let canvasW = drawW;
  let canvasH = drawH;
  if (Math.abs(imgAspect - TARGET_ASPECT) > 0.005) {
    if (imgAspect > TARGET_ASPECT) {
      // Bilden är bredare än 3:4 → bygg ut höjden med kräm-band
      canvasH = Math.round(drawW / TARGET_ASPECT);
    } else {
      // Bilden är smalare än 3:4 → bygg ut bredden med kräm-band
      canvasW = Math.round(drawH * TARGET_ASPECT);
    }
  }
  const dx = Math.round((canvasW - drawW) / 2);
  const dy = Math.round((canvasH - drawH) / 2);

  // Kort-väg: bilden är redan ≈3:4 och inte över limits — släpp igenom
  if (
    canvasW === drawW &&
    canvasH === drawH &&
    file.size <= maxBytes &&
    bitmap.width <= maxDim &&
    bitmap.height <= maxDim
  ) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.fillStyle = PAD_COLOR;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.drawImage(bitmap, dx, dy, drawW, drawH);

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
