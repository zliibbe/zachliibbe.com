import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getLatestSnapshot, getSeries } from '@/lib/garmin-health/kv';
import type { GarminCategory, SleepSnapshot } from '@/lib/garmin-health/types';

export const dynamic = 'force-dynamic';

// Categories are wired up one phase at a time on the sync side; only
// 'sleep' has real data today. Extend as 'activity' | 'activities' |
// 'training' land.
const SUPPORTED_CATEGORIES: readonly GarminCategory[] = ['sleep'];

type RouteContext = {
  params: Promise<{ category: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== 'zliibbe@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { category } = await context.params;
  if (!SUPPORTED_CATEGORIES.includes(category as GarminCategory)) {
    return NextResponse.json(
      { error: `Unknown or not-yet-available category: ${category}` },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get('range') ?? '30');

  try {
    const [latest, series] = await Promise.all([
      getLatestSnapshot<SleepSnapshot>('sleep'),
      getSeries<SleepSnapshot>('sleep', days),
    ]);
    return NextResponse.json({ latest, series });
  } catch (error) {
    console.error(`[me/health/${category}] KV read error:`, error);
    return NextResponse.json(
      { error: 'Failed to load health data' },
      { status: 500 }
    );
  }
}
