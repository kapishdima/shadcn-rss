import { NextResponse } from "next/server";
import { syncRegistries } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    console.log("[Cron] Starting registries sync...");
    const result = await syncRegistries();
    console.log("[Cron] Registries sync complete:", result);

    return NextResponse.json({
      success: true,
      message: "Registries synced successfully",
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
