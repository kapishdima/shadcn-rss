import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { syncRegistries, syncOfficialRegistry } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    console.log("[Cron] Starting registries sync...");

    // Sync official registry first
    console.log("[Cron] Syncing official registry...");
    const officialResult = await syncOfficialRegistry();
    console.log("[Cron] Official registry sync complete:", officialResult);

    // Sync community registries
    const result = await syncRegistries();
    console.log("[Cron] Registries sync complete:", result);

    // Revalidate homepage to show fresh data
    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: "Registries synced successfully",
      official: officialResult,
      ...result,
    });
  } catch (error) {
    console.error("[Cron] Registries sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
