import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPostBySlug } from '@/lib/blog-storage';
import { clearImageCache } from '@/lib/blog-with-images';
import {
  getPhotoAttribution,
  getPhotosForBlogPost,
  trackPhotoDownload,
} from '@/lib/unsplash';
import type { FeaturedImage } from '@/types/blog';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Get the post
    const post = await getPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    try {
      // Search for multiple relevant photos on Unsplash
      const photos = await getPhotosForBlogPost(
        post.categories,
        post.tags,
        post.title,
        8 // Get 8 options
      );

      if (photos.length === 0) {
        return NextResponse.json({
          message: 'No suitable images found',
          options: [],
        });
      }

      // Convert photos to image options with attribution
      const imageOptions = photos.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        thumbnailUrl: photo.urls.small,
        alt:
          photo.alt_description ||
          photo.description ||
          `Image for ${post.title}`,
        width: photo.width,
        height: photo.height,
        attribution: getPhotoAttribution(photo),
        downloadLocation: photo.links.download_location,
      }));

      return NextResponse.json({
        message: 'Image options found',
        options: imageOptions,
        postTitle: post.title,
      });
    } catch (unsplashError) {
      console.error('Error fetching from Unsplash:', unsplashError);
      return NextResponse.json(
        {
          error: 'Failed to fetch images from Unsplash',
          details:
            process.env.NODE_ENV === 'development'
              ? String(unsplashError)
              : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error getting image options:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await context.params;
    const body = await req.json();
    const { selectedImageId } = body;

    if (!slug || !selectedImageId) {
      return NextResponse.json(
        { error: 'Slug and selectedImageId are required' },
        { status: 400 }
      );
    }

    // Get the post
    const post = await getPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check for force replace flag in the request body
    const forceReplace = body.forceReplace === true;

    // Check if post already has a featured image (only block if not forcing replacement)
    if (post.featuredImage && !forceReplace) {
      return NextResponse.json(
        {
          error: 'Post already has a featured image',
          featuredImage: post.featuredImage,
        },
        { status: 400 }
      );
    }

    try {
      // Get multiple photos to find the selected one
      const photos = await getPhotosForBlogPost(
        post.categories,
        post.tags,
        post.title,
        8
      );

      const selectedPhoto = photos.find(photo => photo.id === selectedImageId);
      if (!selectedPhoto) {
        return NextResponse.json(
          { error: 'Selected image not found' },
          { status: 404 }
        );
      }

      // Track download as required by Unsplash API
      await trackPhotoDownload(selectedPhoto.links.download_location);

      // Create the featured image object
      const featuredImage: FeaturedImage = {
        url: selectedPhoto.urls.regular,
        alt:
          selectedPhoto.alt_description ||
          selectedPhoto.description ||
          `Featured image for ${post.title}`,
        width: selectedPhoto.width,
        height: selectedPhoto.height,
        attribution: getPhotoAttribution(selectedPhoto),
      };

      // Update the post with the featured image (imported from generate-image route)
      const { updateBlogPost } = await import('@/lib/blog-storage');
      await updateBlogPost(slug, { featuredImage });

      // Clear any in-memory image cache and revalidate relevant pages
      clearImageCache(slug);
      revalidatePath(`/blog/${slug}`);
      revalidatePath('/blog');

      return NextResponse.json({
        message: forceReplace
          ? 'Featured image replaced successfully'
          : 'Featured image added successfully',
        featuredImage,
      });
    } catch (unsplashError) {
      console.error('Error processing selected image:', unsplashError);
      return NextResponse.json(
        {
          error: 'Failed to process selected image',
          details:
            process.env.NODE_ENV === 'development'
              ? String(unsplashError)
              : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error setting selected image:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
