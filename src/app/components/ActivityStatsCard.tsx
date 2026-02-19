'use client';

import {
  formatDistanceToMiles,
  formatDistanceToYards,
  formatElapsedTime,
} from '@/app/utils/index';
import styles from './ActivityStatsCard.module.css';

interface ActivityStatsCardProps {
  activity: {
    id: string | number;
    name: string;
    type: string;
    distance?: number;
    moving_time?: number;
    elapsed_time?: number;
    total_elevation_gain?: number;
    average_speed?: number;
    average_heartrate?: number;
    kudos_count?: number;
  };
}

export default function ActivityStatsCard({
  activity,
}: ActivityStatsCardProps) {
  // Calculate pace for runs (min/mile)
  const calculatePace = () => {
    if (!activity.moving_time || !activity.distance) return null;
    const miles = activity.distance / 1609.34;
    const minutes = activity.moving_time / 60;
    const paceMinutes = minutes / miles;
    const paceMin = Math.floor(paceMinutes);
    const paceSec = Math.floor((paceMinutes - paceMin) * 60);
    return `${paceMin}:${paceSec.toString().padStart(2, '0')}/mi`;
  };

  // Convert elevation to feet
  const elevationFeet = activity.total_elevation_gain
    ? Math.round(activity.total_elevation_gain * 3.28084)
    : null;

  // Format distance based on activity type
  const getFormattedDistance = () => {
    if (!activity.distance) return null;
    if (activity.type.toLowerCase() === 'swim') {
      return formatDistanceToYards(activity.distance);
    }
    return formatDistanceToMiles(activity.distance);
  };

  // Get activity emoji based on type
  const getActivityEmoji = () => {
    switch (activity.type.toLowerCase()) {
      case 'run':
        return '🏃';
      case 'ride':
        return '🚴';
      case 'swim':
        return '🏊';
      case 'walk':
        return '🚶';
      case 'weighttraining':
      case 'workout':
        return '🏋️';
      case 'hike':
        return '🥾';
      default:
        return '💪';
    }
  };

  const distance = getFormattedDistance();
  const duration = activity.moving_time
    ? formatElapsedTime(activity.moving_time)
    : activity.elapsed_time
      ? formatElapsedTime(activity.elapsed_time)
      : null;
  const pace = activity.type.toLowerCase() === 'run' ? calculatePace() : null;

  return (
    <div className={styles.statsCard}>
      <div className={styles.header}>
        <span className={styles.emoji}>{getActivityEmoji()}</span>
        <span className={styles.name}>{activity.name}</span>
      </div>

      <div className={styles.stats}>
        {distance && duration && (
          <div className={styles.statRow}>
            <span className={styles.statLabel}>
              {distance} • {duration}
            </span>
          </div>
        )}

        {pace && (
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Pace: {pace}</span>
          </div>
        )}

        {activity.average_heartrate && (
          <div className={styles.statRow}>
            <span className={styles.statIcon}>❤️</span>
            <span className={styles.statValue}>
              {Math.round(activity.average_heartrate)} bpm avg
            </span>
          </div>
        )}

        {elevationFeet && elevationFeet > 0 && (
          <div className={styles.statRow}>
            <span className={styles.statIcon}>⛰️</span>
            <span className={styles.statValue}>
              {elevationFeet}ft elevation
            </span>
          </div>
        )}

        {activity.kudos_count !== undefined && activity.kudos_count > 0 && (
          <div className={styles.statRow}>
            <span className={styles.statIcon}>👍</span>
            <span className={styles.statValue}>
              {activity.kudos_count} kudos
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
