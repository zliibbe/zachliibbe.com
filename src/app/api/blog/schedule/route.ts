import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { schedulePost, getPostBySlug } from "@/lib/blog-storage";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CSRF Protection
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    if (!origin || !referer || !host) {
      return NextResponse.json(
        { error: "Missing required headers" },
        { status: 400 },
      );
    }

    // Handle both development (http://localhost:3000) and production (https://domain.com)
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`, // For development
    ];
    
    const isValidOrigin = allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin && referer.startsWith(allowedOrigin)
    );
    
    if (!isValidOrigin) {
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { slug, scheduledFor } = body;

    if (!slug || !scheduledFor) {
      return NextResponse.json(
        { error: "Missing required fields: slug, scheduledFor" },
        { status: 400 },
      );
    }

    // Validate that the post exists
    const existingPost = getPostBySlug(slug);
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Validate scheduled date format and future date
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduledFor date format. Use ISO 8601 format." },
        { status: 400 },
      );
    }

    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Scheduled date must be in the future" },
        { status: 400 },
      );
    }

    // Schedule the post
    const scheduledPost = schedulePost(slug, scheduledFor);

    if (!scheduledPost) {
      return NextResponse.json(
        { error: "Failed to schedule post. Post may already be published." },
        { status: 400 },
      );
    }

    console.log(
      `Successfully scheduled post: ${scheduledPost.title} for ${scheduledFor}`,
    );

    return NextResponse.json({
      success: true,
      message: "Blog post scheduled successfully",
      post: {
        slug: scheduledPost.slug,
        title: scheduledPost.title,
        status: scheduledPost.status,
        scheduledFor: scheduledPost.scheduledFor,
      },
    });
  } catch (error) {
    console.error("Error scheduling blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
