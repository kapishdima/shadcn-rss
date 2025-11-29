import { NextResponse } from "next/server";
import { syncRssFeeds } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for RSS sync (many feeds)

export async function GET() {
  try {
    console.log("[Cron] Starting RSS feeds sync...");
    const result = await syncRssFeeds();
    console.log("[Cron] RSS feeds sync complete:", result);

    return NextResponse.json({
      success: true,
      message: "RSS feeds synced successfully",
      ...result,
    });
  } catch (error) {
    console.error("[Cron] RSS feeds sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
