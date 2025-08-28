import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { publishDraft } from "@/lib/blog-storage";

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

    // Verify the request is coming from our domain (allow localhost for development)
    const isLocalhost =
      host.includes("localhost") || host.includes("127.0.0.1");
    const allowedOrigin = isLocalhost ? `http://${host}` : `https://${host}`;

    if (origin !== allowedOrigin || !referer.startsWith(allowedOrigin)) {
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { error: "Missing required field: slug" },
        { status: 400 },
      );
    }

    const publishedPost = publishDraft(slug);

    if (!publishedPost) {
      return NextResponse.json(
        { error: "Blog post not found or already published" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Blog post published",
      post: publishedPost,
    });
  } catch (error) {
    console.error("Error publishing blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
