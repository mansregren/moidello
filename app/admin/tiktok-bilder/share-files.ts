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

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files })
  ) {
    try {
      await navigator.share({ files });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (ios) {
        throw new Error(
          "Spara via delningsmenyn misslyckades. Håll fingret på en bild nedan och välj Lägg till i Bilder.",
        );
      }
      // Desktop: fall vidare till download-fallback
    }
  } else if (ios) {
    throw new Error(
      "Den här webbläsaren tillåter inte direkt-spara till Bilder. Håll fingret på en bild nedan och välj Lägg till i Bilder.",
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
