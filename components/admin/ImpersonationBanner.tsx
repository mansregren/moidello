import { stopImpersonation } from "@/app/actions/admin-users";
import { getImpersonationTarget } from "@/lib/admin";

async function handleStop() {
  "use server";
  await stopImpersonation();
}

/**
 * Renders a top-of-page banner when the current admin is acting as
 * another user. Server component — re-renders on each request to reflect
 * the cookie state.
 */
export async function ImpersonationBanner() {
  const target = await getImpersonationTarget();
  if (!target) return null;

  const label = target.targetDisplayName ?? target.targetUsername ?? "okänd";

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-sm">
        <p className="font-medium">
          Du postar som <span className="font-bold">{label}</span>
          {target.targetUsername && (
            <span className="opacity-70"> @{target.targetUsername}</span>
          )}
        </p>
        <form action={handleStop}>
          <button
            type="submit"
            className="rounded-full bg-background text-foreground px-3 py-1 text-xs font-semibold hover:bg-background/80"
          >
            Återgå
          </button>
        </form>
      </div>
    </div>
  );
}
