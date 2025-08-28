import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    
    // TODO: Implement blog post retrieval by slug
    console.log("Fetching blog post:", slug);
    
    return NextResponse.json({ slug, post: null });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { slug } = params;
    const body = await request.json();
    
    // TODO: Implement blog post update
    console.log("Updating blog post:", slug, body);
    
    return NextResponse.json({ message: "Blog post updated", slug });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { slug } = params;
    
    // TODO: Implement blog post deletion
    console.log("Deleting blog post:", slug);
    
    return NextResponse.json({ message: "Blog post deleted", slug });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}