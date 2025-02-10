import { NextResponse } from "next/server";
import getLatestActivity from "@/app/api/getLatestActivity";

export const dynamic = "force-dynamic"; // Disable route caching
export const revalidate = 0; // Disable revalidation cache

export async function GET() {
  try {
    const activity = await getLatestActivity();
    return NextResponse.json(activity);
  } catch (error: any) {
    console.error("API Route Error Details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: "Failed to fetch activity",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
