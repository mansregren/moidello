/**
 * Delar/laddar ned File[]-objekt — försök Web Share först (iPhone får
 * "Save to Photos" via share-sheet), faller tillbaka till <a download>
 * på desktop. På iOS skippar vi download-fallback eftersom det skulle
 * landa i Files istället för Photos — då kastar vi istället ett fel som
 * UI:t kan visa som "long-press på thumbnail".
 */

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPad Pro på iPadOS 13+ identifierar sig som Mac men har touch
  if (
    navigator.platform === "MacIntel" &&
    typeof navigator.maxTouchPoints === "number" &&
    navigator.maxTouchPoints > 1
  ) {
    return true;
  }
  return false;
}

export async function shareOrSavePhotos(files: File[]): Promise<void> {
  const ios = isIOS();
  // navigator.canShare() lögnar på vissa iOS-versioner (svarar nej trots
  // att share() hade fungerat) — så vi förlitar oss inte på den som grind,
  // bara på att navigator.share faktiskt finns, och försöker på riktigt.
  const canShareFn =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  if (canShareFn) {
    try {
      await navigator.share({ files });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // iOS Safari delar flera filer på en gång opålitligt — fall vidare
      // till en-fil-i-taget nedan istället för att ge upp direkt.
    }

    if (files.length > 1) {
      let shared = 0;
      for (const file of files) {
        try {
          await navigator.share({ files: [file] });
          shared++;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            if (shared > 0) return;
            continue;
          }
          // User-aktiveringen är troligen förbrukad — avbryt loopen,
          // resten får sparas via long-press.
          break;
        }
      }
      if (shared === files.length) return;
      if (shared > 0) {
        throw new Error(
          `Saved ${shared} of ${files.length} images. Press and hold the rest below and choose Add to Photos.`,
        );
      }
    }

    if (ios) {
      throw new Error(
        "Saving via the share sheet failed. Press and hold an image below and choose Add to Photos.",
      );
    }
  } else if (ios) {
    throw new Error(
      "This browser doesn't allow saving directly to Photos. Press and hold an image below and choose Add to Photos.",
    );
  }

  // Desktop fallback — sekventiell <a download>
  for (const file of files) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    await new Promise((r) => setTimeout(r, 150));
  }
}
