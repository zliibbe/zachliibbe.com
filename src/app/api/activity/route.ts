import { NextResponse } from "next/server";
import getLatestActivity from "@/app/api/getLatestActivity";

export async function GET() {
  try {
    const activity = await getLatestActivity();
    return NextResponse.json(activity);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 },
    );
  }
}
