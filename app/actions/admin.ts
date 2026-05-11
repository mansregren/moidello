"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";

type ReportStatus = "open" | "reviewed" | "dismissed" | "actioned";

const ALLOWED: ReportStatus[] = ["open", "reviewed", "dismissed", "actioned"];

export async function setReportStatus(
  id: string,
  status: ReportStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!ALLOWED.includes(status)) {
    return { ok: false, error: "Ogiltig status." };
  }
  const admin = await isCurrentUserAdmin();
  if (!admin) return { ok: false, error: "Inte behörig." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/anmalningar");
  return { ok: true };
}
