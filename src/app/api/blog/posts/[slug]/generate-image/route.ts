import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPostBySlug, updatePost } from "@/lib/blog-storage";
import { getPhotoForBlogPost, getPhotoAttribution, trackPhotoDownload } from "@/lib/unsplash";
import { FeaturedImage } from "@/types/blog";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Get the post
    const post = getPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if post already has a featured image
    if (post.featuredImage) {
      return NextResponse.json({ 
        error: "Post already has a featured image",
        featuredImage: post.featuredImage 
      }, { status: 400 });
    }

    try {
      // Search for a relevant photo on Unsplash
      const photo = await getPhotoForBlogPost(
        post.categories,
        post.tags,
        post.title
      );

      if (!photo) {
        return NextResponse.json({ 
          message: "No suitable image found",
          featuredImage: null 
        });
      }

      // Track download as required by Unsplash API
      await trackPhotoDownload(photo.links.download_location);

      // Create the featured image object
      const featuredImage: FeaturedImage = {
        url: photo.urls.regular,
        alt: photo.alt_description || photo.description || `Featured image for ${post.title}`,
        width: photo.width,
        height: photo.height,
        attribution: getPhotoAttribution(photo),
      };

      // Update the post with the featured image
      const updatedPost = {
        ...post,
        featuredImage,
      };

      updatePost(slug, updatedPost);

      return NextResponse.json({
        message: "Featured image added successfully",
        featuredImage,
      });

    } catch (unsplashError) {
      console.error("Error fetching from Unsplash:", unsplashError);
      return NextResponse.json({ 
        error: "Failed to fetch image from Unsplash",
        details: process.env.NODE_ENV === 'development' ? String(unsplashError) : undefined
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error generating featured image:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}