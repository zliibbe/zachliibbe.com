import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CSRF Protection
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    
    if (!origin || !referer || !host) {
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
    }

    const allowedOrigin = `https://${host}`;
    if (origin !== allowedOrigin || !referer.startsWith(allowedOrigin)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const body = await request.json();
    const { slug, scheduledFor } = body;
    
    if (!slug || !scheduledFor) {
      return NextResponse.json(
        { error: "Missing required fields: slug, scheduledFor" },
        { status: 400 }
      );
    }

    // TODO: Implement blog post scheduling
    console.log("Scheduling blog post:", slug, "for:", scheduledFor);
    
    return NextResponse.json({ 
      message: "Blog post scheduled", 
      slug, 
      scheduledFor 
    });
  } catch (error) {
    console.error("Error scheduling blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}