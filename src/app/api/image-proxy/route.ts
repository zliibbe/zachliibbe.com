import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("Missing image URL", { status: 400 });
    }

    // Add a random query parameter to bypass Goodreads cache
    const urlWithCache = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}_=${Date.now()}`;

    const response = await fetch(urlWithCache, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.goodreads.com/",
        Origin: "https://www.goodreads.com",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch image: ${response.status} ${response.statusText}`,
      );

      // Return a placeholder image instead of an error
      const placeholderUrl =
        "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png";
      const placeholderResponse = await fetch(placeholderUrl);
      const placeholderData = await placeholderResponse.arrayBuffer();

      return new NextResponse(placeholderData, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const imageData = await response.arrayBuffer();

    return new NextResponse(imageData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error in image proxy:", error);

    // Return a placeholder image on error
    try {
      const placeholderUrl =
        "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png";
      const placeholderResponse = await fetch(placeholderUrl);
      const placeholderData = await placeholderResponse.arrayBuffer();

      return new NextResponse(placeholderData, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return new NextResponse(
        `Error proxying image: ${error instanceof Error ? error.message : "Unknown error"}`,
        { status: 500 },
      );
    }
  }
}
