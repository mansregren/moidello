// Outfit-bilden visas i en aspect-[3/4]-ruta på /skapa och i en cover-ruta
// på outfit-detail-sidan. Vi center-beskär (cover) uppladdade bilder till
// exakt 3:4 så de FYLLER rutan helt — inga kräm-band/kanter. Pinterest-
// nedladdningar (2:3, 9:16, landscape) beskärs centrerat så motivet behålls.
const TARGET_ASPECT = 3 / 4; // bredd / höjd (portrait)
const PAD_COLOR = "#F7F6F3"; // 1px-säkerhet vid avrundning, syns ej

/**
 * Downscale + center-crop (cover) a user-selected image to a 3:4 portrait
 * canvas so it fills the frame with no letterbox bars. Runs entirely in the
 * browser via canvas — no upload happens here.
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

  // Bestäm 3:4-canvas genom att beskära den långa sidan (cover, ingen padd).
  const imgAspect = drawW / drawH;
  let canvasW = drawW;
  let canvasH = drawH;
  if (Math.abs(imgAspect - TARGET_ASPECT) > 0.005) {
    if (imgAspect > TARGET_ASPECT) {
      // Bredare än 3:4 → behåll höjden, beskär bredden.
      canvasW = Math.round(drawH * TARGET_ASPECT);
    } else {
      // Smalare än 3:4 → behåll bredden, beskär höjden.
      canvasH = Math.round(drawW / TARGET_ASPECT);
    }
  }
  // Negativa offsets centrerar bilden och beskär överskjutande kanter.
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

/**
 * Downscale a user-selected image (keeping the FULL frame, no crop) so we can
 * preview it and let the user pick a zoom/crop before publishing. Returns the
 * downscaled JPEG plus its dimensions.
 */
export async function prepareUpload(
  file: File,
  options: { maxDim?: number; quality?: number } = {},
): Promise<{ file: File; width: number; height: number }> {
  const maxDim = options.maxDim ?? 2000;
  const quality = options.quality ?? 0.85;

  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    const { width, height } = await readDimensions(file);
    return { file, width, height };
  }

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxDim / bitmap.width, maxDim / bitmap.height, 1);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  if (ratio === 1 && file.size <= 5 * 1024 * 1024) {
    return { file, width: w, height: h };
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { file, width: bitmap.width, height: bitmap.height };
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) return { file, width: w, height: h };
  const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return { file: new File([blob], newName, { type: "image/jpeg" }), width: w, height: h };
}

/**
 * Center-crop an image to 3:4 at a given zoom. zoom=1 is the largest 3:4
 * region that fits (standard cover crop); zoom>1 crops a tighter centred
 * region (zooms in). Mirrors the CSS `object-cover` + `scale(zoom)` preview
 * so what the user sees is what gets published.
 */
export async function cropTo34(file: File, zoom = 1): Promise<File> {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }
  const z = Math.max(1, Math.min(zoom, 4));
  const bitmap = await createImageBitmap(file);
  const w = bitmap.width;
  const h = bitmap.height;
  const imgAspect = w / h;

  // Largest 3:4 region centred in the image (zoom=1).
  let baseW: number;
  let baseH: number;
  if (imgAspect > TARGET_ASPECT) {
    baseH = h;
    baseW = h * TARGET_ASPECT;
  } else {
    baseW = w;
    baseH = w / TARGET_ASPECT;
  }
  const cropW = baseW / z;
  const cropH = baseH / z;
  const sx = (w - cropW) / 2;
  const sy = (h - cropH) / 2;

  const outH = Math.min(Math.round(baseH), 1600);
  const outW = Math.round(outH * TARGET_ASPECT);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.fillStyle = PAD_COLOR;
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, outW, outH);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
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
