import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getLatestSnapshot,
  getRecentActivities,
  getSeries,
} from '@/lib/garmin-health/kv';
import type {
  ActivitySnapshot,
  GarminActivity,
  GarminCategory,
  SleepSnapshot,
  TrainingSnapshot,
} from '@/lib/garmin-health/types';

export const dynamic = 'force-dynamic';

// All four v1 categories are now wired up on the sync side.
const SUPPORTED_CATEGORIES: readonly GarminCategory[] = [
  'sleep',
  'activity',
  'activities',
  'training',
];

type RouteContext = {
  params: Promise<{ category: string }>;
};

async function fetchCategoryData(category: GarminCategory, days: number) {
  switch (category) {
    case 'sleep':
      return {
        latest: await getLatestSnapshot<SleepSnapshot>('sleep'),
        series: await getSeries<SleepSnapshot>('sleep', days),
      };
    case 'activity':
      return {
        latest: await getLatestSnapshot<ActivitySnapshot>('activity'),
        series: await getSeries<ActivitySnapshot>('activity', days),
      };
    case 'activities':
      return { activities: await getRecentActivities<GarminActivity>() };
    case 'training':
      return {
        latest: await getLatestSnapshot<TrainingSnapshot>('training'),
        series: await getSeries<TrainingSnapshot>('training', days),
      };
  }
}

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
    const data = await fetchCategoryData(category as GarminCategory, days);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[me/health/${category}] KV read error:`, error);
    return NextResponse.json(
      { error: 'Failed to load health data' },
      { status: 500 }
    );
  }
}
