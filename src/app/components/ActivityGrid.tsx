'use client';

import React, { useEffect, useRef } from 'react';
// import SafeCalendarHeatmap from "./CalendarHeatmapWrapper";
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import styles from './ActivityGrid.module.css';
import moment from 'moment';
import { StravaActivity } from '@/lib/strava/types';
import { ReactCalendarHeatmapValue } from 'react-calendar-heatmap';
import { getTimeAgo } from '@/app/utils/index';

// Note: Testing if SafeCalendarHeatmap wrapper is still needed for React 19
// Temporarily using CalendarHeatmap directly to check for console errors

interface ActivityGridProps {
  activities: StravaActivity[];
}

interface HeatmapValue extends ReactCalendarHeatmapValue<string> {
  type: string;
  name: string;
  distance?: number;
  moving_time?: number;
  activities?: ActivityData[]; // For days with multiple activities
}

interface ActivityData {
  type: string;
  name: string;
  distance?: number;
  moving_time?: number;
  id: string | number;
}

export default function ActivityGrid({ activities }: ActivityGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Helper function to get color for activity type
  const getColorForType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'run':
        return '#f32128';
      case 'ride':
        return '#4caf50';
      case 'swim':
        return '#2196f3';
      case 'alpineski':
        return '#f1c70c';
      case 'hike':
        return '#795548';
      case 'walk':
        return '#ff9800';
      case 'weighttraining':
        return '#9c27b0';
      default:
        return '#b5b5b5'; // Light gray for no recorded activity (71% lightness)
    }
  };

  // Aggregate activities by date (do this before any returns to avoid conditional hook calls)
  const activitiesByDate =
    activities && Array.isArray(activities) && activities.length > 0
      ? activities.reduce(
          (acc, activity) => {
            const date = moment(activity.start_date).format('YYYY-MM-DD');
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push({
              type: activity.type.toLowerCase(),
              name: activity.name,
              distance: activity.distance,
              moving_time: activity.moving_time,
              id: activity.id,
            });
            return acc;
          },
          {} as Record<string, ActivityData[]>
        )
      : {};

  // Create heatmap values with multi-activity support
  const values = Object.entries(activitiesByDate).map(
    ([date, dayActivities]) => {
      if (dayActivities.length === 1 && dayActivities[0]) {
        // Single activity - use existing format
        const activity = dayActivities[0];
        return {
          date,
          count: 1,
          type: activity.type,
          name: activity.name,
          distance: activity.distance,
          moving_time: activity.moving_time,
        };
      } else {
        // Multiple activities - store all activities
        return {
          date,
          count: dayActivities.length,
          type: 'multiple', // Special type for multi-activity days
          name: `${dayActivities.length} recorded activities`,
          activities: dayActivities,
        };
      }
    }
  );

  const getClassForValue = (
    value: ReactCalendarHeatmapValue<string> | undefined
  ): string => {
    const heatmapValue = value as HeatmapValue | null | undefined;

    if (!heatmapValue || !heatmapValue.type) {
      return styles.colorEmpty!;
    }

    // For multi-activity days, return a placeholder class
    if (heatmapValue.type === 'multiple') {
      return styles.colorMultiple!;
    }

    const type = heatmapValue.type.toLowerCase();

    switch (type) {
      case 'run':
        return styles.colorRun!;
      case 'ride':
        return styles.colorRide!;
      case 'swim':
        return styles.colorSwim!;
      case 'alpineski':
        return styles.colorAlpineski!;
      case 'hike':
        return styles.colorHike!;
      case 'walk':
        return styles.colorWalk!;
      case 'weighttraining':
        return styles.colorWeighttraining!;
      default:
        return styles.colorEmpty!;
    }
  };

  // Add rounded corners and split squares for multi-activity days after render
  useEffect(() => {
    const processSquares = () => {
      if (!gridRef.current) return;

      const rects = gridRef.current.querySelectorAll(
        '.react-calendar-heatmap rect'
      );

      rects.forEach((rect, index) => {
        // Add rounded corners to all squares
        rect.setAttribute('rx', '3');
        rect.setAttribute('ry', '3');

        // Check if this square represents a multi-activity day by looking at its title
        const title = (rect.querySelector('title')?.textContent || '').trim();
        const isMultiActivity = title.includes('activities on');

        if (isMultiActivity && rect.parentElement) {
          // Extract the date from the title
          const dateMatch = title.match(/(\d+) activities on (.+?) \(/);
          if (!dateMatch) return;

          const dateStr = dateMatch[2];

          // Find the corresponding value data
          const valueData = values.find(v => {
            const valDate = moment(v.date).format('MMMM D, YYYY');
            return valDate === dateStr && v.type === 'multiple' && v.activities;
          });

          if (
            !valueData ||
            !valueData.activities ||
            valueData.activities.length < 2
          )
            return;

          // Skip if already processed
          if (rect.getAttribute('data-split-processed')) return;
          rect.setAttribute('data-split-processed', 'true');

          // Get rect dimensions
          const x = parseFloat(rect.getAttribute('x') || '0');
          const y = parseFloat(rect.getAttribute('y') || '0');
          const width = parseFloat(rect.getAttribute('width') || '10');
          const height = parseFloat(rect.getAttribute('height') || '10');

          // Get colors for first two activities
          const activity1 = valueData.activities[0];
          const activity2 = valueData.activities[1];
          if (!activity1 || !activity2) return;

          const color1 = getColorForType(activity1.type);
          const color2 = getColorForType(activity2.type);

          // Create unique clip path IDs
          const uniqueId = `${valueData.date.replace(/[^a-zA-Z0-9]/g, '')}-${index}`;
          const clipId1 = `clip-lower-${uniqueId}`;
          const clipId2 = `clip-upper-${uniqueId}`;

          // Ensure defs element exists
          let defs = gridRef.current?.querySelector('defs');
          if (!defs && gridRef.current) {
            defs = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'defs'
            );
            gridRef.current.querySelector('svg')?.prepend(defs);
          }

          if (!defs) return; // Skip if defs couldn't be created

          // Create clip paths for diagonal split
          // Upper-left triangle for first activity: top-left, bottom-left, top-right
          const clipPath1 = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'clipPath'
          );
          clipPath1.setAttribute('id', clipId1);
          const polygon1 = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'polygon'
          );
          polygon1.setAttribute(
            'points',
            `${x},${y} ${x},${y + height} ${x + width},${y}`
          );
          clipPath1.appendChild(polygon1);
          defs.appendChild(clipPath1);

          // Lower-right triangle for second activity: bottom-left, bottom-right, top-right
          const clipPath2 = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'clipPath'
          );
          clipPath2.setAttribute('id', clipId2);
          const polygon2 = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'polygon'
          );
          polygon2.setAttribute(
            'points',
            `${x},${y + height} ${x + width},${y + height} ${x + width},${y}`
          );
          clipPath2.appendChild(polygon2);
          defs.appendChild(clipPath2);

          // Clone the rect for the second activity (lower-right)
          const rect2 = rect.cloneNode(true) as SVGRectElement;
          rect2.setAttribute('fill', color2);
          rect2.setAttribute('clip-path', `url(#${clipId2})`);
          rect2.removeAttribute('class');

          // Modify original rect for first activity (upper-left)
          rect.setAttribute('fill', color1);
          rect.setAttribute('clip-path', `url(#${clipId1})`);
          rect.removeAttribute('class');

          // Insert the second rect
          rect.parentElement.insertBefore(rect2, rect.nextSibling);
        }
      });
    };

    // Process squares after initial render
    const timer = setTimeout(processSquares, 100);

    // Observe DOM changes to handle dynamic updates
    const observer = new MutationObserver(processSquares);
    if (gridRef.current) {
      observer.observe(gridRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [activities, values]);

  // Conditional renders after all hooks
  if (!activities) {
    return <div className={styles.errorState}>Loading activities...</div>;
  }

  if (!Array.isArray(activities)) {
    console.error('Activities is not an array:', activities);
    return (
      <div className={styles.errorState}>Error: Invalid activity data</div>
    );
  }

  if (!activities.length) {
    return (
      <div className={styles.errorState}>No recorded activities found</div>
    );
  }

  const legendItems = [
    { type: 'Run', className: styles.legendRun },
    { type: 'Bike Ride', className: styles.legendRide },
    { type: 'Swim', className: styles.legendSwim },
    { type: 'Ski', className: styles.legendAlpineski },
    { type: 'Hike', className: styles.legendHike },
    { type: 'Walk', className: styles.legendWalk },
    { type: 'Weight Training', className: styles.legendWeighttraining },
    { type: 'No Recorded Activity', className: styles.legendEmpty },
  ];

  // Helper function to format distance/duration based on activity type
  const formatActivityMetric = (value: HeatmapValue): string => {
    if (!value.distance && !value.moving_time) {
      return 'No data';
    }

    const type = value.type.toLowerCase();

    if (type === 'weighttraining' && value.moving_time) {
      const minutes = Math.round(value.moving_time / 60);
      return `${minutes} minutes`;
    }

    if (type === 'swim' && value.distance) {
      const yards = Math.round(value.distance * 1.09361);
      return `${yards} yards`;
    }

    if (value.distance) {
      const miles = (value.distance * 0.000621371).toFixed(1);
      return `${miles} miles`;
    }

    return 'No data';
  };

  return (
    <>
      <div className={styles.legend}>
        {legendItems.map(item => (
          <div key={item.type} className={styles.legendItem}>
            <div className={`${styles.legendBox} ${item.className}`} />
            <span>{item.type}</span>
          </div>
        ))}
      </div>
      <div className={styles.gridContainer} ref={gridRef}>
        <CalendarHeatmap
          startDate={moment().subtract(11, 'months').toDate()}
          endDate={moment().toDate()}
          values={values}
          classForValue={getClassForValue}
          titleForValue={(
            value: ReactCalendarHeatmapValue<string> | undefined
          ) => {
            if (!value) return 'No recorded activity';
            const val = value as HeatmapValue;

            // Handle multi-activity days
            if (
              val.type === 'multiple' &&
              val.activities &&
              val.activities.length > 0
            ) {
              const timeAgo = getTimeAgo(val.date);
              const activityList = val.activities
                .map((act, i) => {
                  const metric = formatActivityMetric({
                    ...val,
                    type: act.type,
                    distance: act.distance,
                    moving_time: act.moving_time,
                  } as HeatmapValue);
                  return `${i + 1}. ${act.name} - ${metric}`;
                })
                .join('\n');
              return `${val.activities.length} activities on ${moment(val.date).format('MMMM D, YYYY')} (${timeAgo}):\n${activityList}`;
            }

            // Single activity
            const metric = formatActivityMetric(val);
            const timeAgo = getTimeAgo(val.date);
            return `${val.name} - ${metric} on ${moment(val.date).format('MMMM D, YYYY')} (${timeAgo})`;
          }}
          showWeekdayLabels={true}
          weekdayLabels={['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su']}
          horizontal={true}
          gutterSize={2}
        />
      </div>
    </>
  );
}
