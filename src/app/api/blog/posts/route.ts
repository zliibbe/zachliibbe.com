import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAllPosts, createBlogPost } from "@/lib/blog-storage";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = getAllPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CSRF Protection - verify the request origin
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

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: title, content" },
        { status: 400 },
      );
    }

    const newPost = createBlogPost({
      title: body.title,
      content: body.content, // markdown content
      excerpt: body.excerpt,
      categories: body.categories || [],
      tags: body.tags || [],
      series: body.series,
      status: body.status || "draft",
      scheduledFor: body.scheduledFor,
    });

    return NextResponse.json(
      {
        message: "Blog post created",
        post: newPost,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
