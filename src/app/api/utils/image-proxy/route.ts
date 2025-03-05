import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
    }

    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const imageData = await response.arrayBuffer();

    return new NextResponse(imageData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Error in image proxy:", error);
    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 },
    );
  }
}
