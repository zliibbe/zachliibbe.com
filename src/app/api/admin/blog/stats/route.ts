import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getAllPublishedPosts,
  getAllDrafts,
  getAllScheduledPosts,
} from "@/lib/blog-storage";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user?.email !== "zliibbe@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load all blog posts
    const published = getAllPublishedPosts();
    const drafts = getAllDrafts();
    const scheduled = getAllScheduledPosts();

    // Calculate stats
    const stats = {
      published: published.length,
      drafts: drafts.length,
      scheduled: scheduled.length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching blog stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
