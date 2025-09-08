import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  searchPhotos,
  getRemainingRequests,
  getUnsplashMode,
} from '@/lib/unsplash';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'technology';

    // Check rate limits and mode
    const rateInfo = getRemainingRequests();
    const mode = getUnsplashMode();

    console.log('Unsplash Debug - Rate Info:', rateInfo);
    console.log('Unsplash Debug - Mode:', mode);
    console.log('Unsplash Debug - Testing search for:', query);

    if (mode === 'unconfigured') {
      return NextResponse.json({
        error: 'Unsplash API not configured',
        mode,
        rateInfo,
      });
    }

    // Test a simple search
    const photos = await searchPhotos(query, 3);

    return NextResponse.json({
      success: true,
      query,
      mode,
      rateInfo,
      photosFound: photos.length,
      photos: photos.map(photo => ({
        id: photo.id,
        description: photo.description || photo.alt_description,
        urls: {
          small: photo.urls.small,
          regular: photo.urls.regular,
        },
        user: photo.user.name,
      })),
    });
  } catch (error) {
    console.error('Debug Unsplash Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: String(error),
      },
      { status: 500 }
    );
  }
}
