---
title: 'Building Interactive Data Visualizations: The Activity Heatmap That Nearly Broke Me'
author: 'Zach Liibbe'
publishedAt: ''
status: 'draft'
categories: ['Development', 'Learning']
tags:
  [
    'data-visualization',
    'react',
    'svg',
    'calendar-heatmap',
    'performance',
    'strava-api',
    'interactive-charts',
  ]
series: 'Learning in Public'
excerpt: 'Building a GitHub-style activity heatmap for Strava data seemed simple until I hit SVG performance walls, browser compatibility issues, and the dark arts of dynamic styling. How I learned to wrangle complex data visualizations in React.'
readTime: '11 min read'
---

# Building Interactive Data Visualizations: The Activity Heatmap That Nearly Broke Me

"I want something like GitHub's contribution graph, but for my fitness activities."

That innocent request led me down a rabbit hole of SVG manipulation, performance optimization, and the realization that data visualization on the web is significantly harder than it looks. What started as a simple calendar heatmap turned into a masterclass in handling complex interactions, dynamic styling, and browser quirks.

Here's how I built an interactive activity visualization that nearly broke my browser—and my sanity.

## The Vision: GitHub for Fitness

I wanted to visualize my Strava activities as a year-long calendar heatmap, similar to GitHub's contribution graph. Each day would show:

- **Activity type** (run, bike, hike) with different colors
- **Hover tooltips** with detailed information
- **Responsive design** that worked on mobile
- **Smooth animations** and interactions
- **Dynamic legend** that updated based on visible data

Sounds simple, right? Famous last words.

## The Library Rabbit Hole

My first instinct was to find an existing React library. I tried several:

- **react-calendar-heatmap**: Good foundation but limited customization
- **recharts**: Too heavyweight for a simple heatmap
- **d3**: Powerful but massive learning curve
- **custom SVG**: Complete control but everything from scratch

I settled on `react-calendar-heatmap` as a starting point, thinking I could customize it as needed. That decision would haunt me for weeks.

## The Data Transformation Challenge

Strava activities come in a complex format that doesn't map cleanly to a calendar heatmap:

```typescript
// Raw Strava activity data
interface StravaActivity {
  id: number;
  name: string;
  type: string; // "Run", "Ride", "Hike", "WeightTraining", etc.
  distance: number; // meters
  elapsed_time: number; // seconds
  moving_time: number; // seconds
  start_date: string; // ISO string
  total_elevation_gain?: number;
}

// What the heatmap library expected
interface HeatmapValue {
  date: string;
  count: number;
}
```

I needed to transform a year's worth of varied activities into a format that could show meaningful patterns. My first attempt was naive:

```typescript
// This lost all the nuance of the data
const heatmapData = activities.map(activity => ({
  date: activity.start_date,
  count: 1, // Every activity counts as 1
}));
```

This created a boring binary visualization—activity or no activity. I needed something richer.

## The Custom Data Model

I redesigned the data transformation to preserve activity types and metrics:

```typescript
interface HeatmapValue extends ReactCalendarHeatmapValue<string> {
  type: string; // Primary activity type for the day
  name: string; // Activity name for tooltips
  distance?: number; // Total distance for the day
  count: number; // Number of activities
  activities: StravaActivity[]; // All activities for complex days
}

function transformActivitiesForHeatmap(
  activities: StravaActivity[]
): HeatmapValue[] {
  // Group activities by date
  const groupedByDate = activities.reduce(
    (acc, activity) => {
      const date = activity.start_date.split('T')[0]; // Get YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    },
    {} as Record<string, StravaActivity[]>
  );

  // Transform each day's activities
  return Object.entries(groupedByDate).map(([date, dayActivities]) => {
    // Primary activity is the longest one
    const primaryActivity = dayActivities.reduce((longest, current) =>
      current.distance > longest.distance ? current : longest
    );

    // Total distance for the day
    const totalDistance = dayActivities.reduce(
      (sum, activity) => sum + activity.distance,
      0
    );

    return {
      date,
      count: dayActivities.length,
      type: primaryActivity.type.toLowerCase(),
      name: primaryActivity.name,
      distance: totalDistance,
      activities: dayActivities,
    };
  });
}
```

This gave me rich data for each day, but now I needed to visualize it properly.

## The Styling Nightmare

The react-calendar-heatmap library was designed for simple count-based visualizations. I needed dynamic colors based on activity types. The library used CSS classes, but I needed JavaScript-driven styling.

My first approach was CSS overrides:

```css
/* This became unmanageable quickly */
.react-calendar-heatmap .colorRun {
  fill: #f32128 !important;
}

.react-calendar-heatmap .colorRide {
  fill: #4caf50 !important;
}

.react-calendar-heatmap .colorSwim {
  fill: #2196f3 !important;
}

.react-calendar-heatmap .colorAlpineski {
  fill: #f1c70c !important;
}

.react-calendar-heatmap .colorHike {
  fill: #795548 !important;
}

.react-calendar-heatmap .colorWalk {
  fill: #ff9800 !important;
}

.react-calendar-heatmap .colorWeighttraining {
  fill: #9c27b0 !important;
}

.react-calendar-heatmap .colorEmpty {
  fill: var(--clr-neutral-200) !important;
}
```

The problem? The library was generating class names like `color-scale-1`, `color-scale-2`, etc., based on count, not activity type. I needed to override its classification system.

## The Custom Classification Function

I dove into the library's source and discovered the `classForValue` prop:

```typescript
const getClassForValue = (value: any) => {
  if (!value || !value.type) {
    return 'colorEmpty';
  }

  // Map activity types to CSS classes
  const typeMap = {
    run: 'colorRun',
    ride: 'colorRide',
    swim: 'colorSwim',
    alpineski: 'colorAlpineski',
    hike: 'colorHike',
    walk: 'colorWalk',
    weighttraining: 'colorWeighttraining',
  };

  return typeMap[value.type] || 'colorEmpty';
};

// Use in the component
<CalendarHeatmap
  startDate={moment().subtract(11, 'months').toDate()}
  endDate={moment().toDate()}
  values={transformedActivities}
  classForValue={getClassForValue}
  // ... other props
/>
```

This worked, but the colors were still being overridden by the library's default styles. I needed more specificity.

## The SVG Manipulation Deep Dive

The library was generating SVG elements, and CSS specificity wars weren't cutting it. I needed to manipulate the SVG directly after render:

```typescript
export default function ActivityGrid({ activities }: ActivityGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Add custom styling to SVG elements after render
  useEffect(() => {
    const customizeSVG = () => {
      if (gridRef.current) {
        const rects = gridRef.current.querySelectorAll(
          '.react-calendar-heatmap rect'
        );

        rects.forEach(rect => {
          // Add rounded corners for better aesthetics
          rect.setAttribute('rx', '3');
          rect.setAttribute('ry', '3');

          // Force our color scheme
          const className = rect.getAttribute('class') || '';
          if (className.includes('colorRun')) {
            rect.setAttribute('fill', '#f32128');
          } else if (className.includes('colorRide')) {
            rect.setAttribute('fill', '#4caf50');
          }
          // ... more color mapping
        });
      }
    };

    // Initial styling
    customizeSVG();

    // Watch for changes (library re-renders)
    const observer = new MutationObserver(() => {
      customizeSVG();
    });

    if (gridRef.current) {
      observer.observe(gridRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [activities]);

  return (
    <div className={styles.gridContainer} ref={gridRef}>
      <CalendarHeatmap
        // ... props
      />
    </div>
  );
}
```

This was getting hacky, but it worked. However, I soon hit a bigger problem: performance.

## The Performance Wall

With a full year of activities (300+ data points), the heatmap was becoming sluggish. Each activity required:

- Data transformation
- SVG element creation
- Color calculation
- Tooltip generation
- Event listeners

On mobile devices, interactions felt laggy. I needed optimization.

### Memoization for Data Processing

```typescript
const transformedActivities = useMemo(() => {
  return transformActivitiesForHeatmap(activities);
}, [activities]);

const colorMap = useMemo(() => {
  return transformedActivities.reduce(
    (map, value) => {
      map[value.date] = getColorForActivityType(value.type);
      return map;
    },
    {} as Record<string, string>
  );
}, [transformedActivities]);
```

### Debounced SVG Manipulation

```typescript
const debouncedCustomization = useMemo(
  () =>
    debounce(() => {
      customizeSVG();
    }, 100),
  []
);

useEffect(() => {
  debouncedCustomization();
}, [activities, debouncedCustomization]);
```

### Virtual Scrolling for Large Datasets

For users with massive activity histories, I implemented a year selector to limit visible data:

```typescript
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

const filteredActivities = useMemo(() => {
  return activities.filter(activity => {
    const activityYear = new Date(activity.start_date).getFullYear();
    return activityYear === selectedYear;
  });
}, [activities, selectedYear]);
```

## The Tooltip Challenge

The library's built-in tooltips were basic. I needed rich, formatted tooltips showing:

- Activity name
- Distance/duration
- Activity type
- Relative time ("3 days ago")

```typescript
const formatActivityMetric = (value: HeatmapValue) => {
  if (!value.distance) return 'No data';

  if (value.type === 'run' || value.type === 'hike' || value.type === 'walk') {
    const miles = (value.distance * 0.000621371).toFixed(1);
    return `${miles} miles`;
  }

  if (value.type === 'ride') {
    const miles = (value.distance * 0.000621371).toFixed(1);
    return `${miles} miles`;
  }

  if (value.type === 'weighttraining') {
    const minutes = Math.round(value.activities[0].moving_time / 60);
    return `${minutes} minutes`;
  }

  return 'No data';
};

// Enhanced tooltip content
titleForValue={(value: ReactCalendarHeatmapValue<any> | undefined) => {
  if (!value) return 'No recorded activity';

  const val = value as HeatmapValue;
  const metric = formatActivityMetric(val);
  const timeAgo = getTimeAgo(val.date);

  return `${val.name} - ${metric} on ${moment(val.date).format('MMMM D, YYYY')} (${timeAgo})`;
}}
```

## The Legend System

A static legend wasn't enough—I needed it to reflect the actual data being displayed:

```typescript
const legendItems = useMemo(() => {
  // Get unique activity types from current data
  const uniqueTypes = [
    ...new Set(transformedActivities.map(activity => activity.type)),
  ];

  return uniqueTypes.map(type => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    className: `legend${type.charAt(0).toUpperCase() + type.slice(1)}`,
    color: getColorForActivityType(type),
  }));
}, [transformedActivities]);

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
    {/* Heatmap component */}
  </>
);
```

## Mobile Responsiveness Hell

The heatmap looked great on desktop but was a disaster on mobile:

- **Text too small**: Month and day labels were unreadable
- **Tooltips broken**: Touch events didn't work like mouse hover
- **Layout overflow**: The calendar was too wide for mobile screens

### Mobile-Specific Optimizations

```css
@media (max-width: 768px) {
  .gridContainer {
    padding: 1rem;
    overflow-x: auto; /* Allow horizontal scrolling */
  }

  .react-calendar-heatmap text {
    font-size: 10px; /* Smaller text for mobile */
  }

  .react-calendar-heatmap rect {
    width: 8px; /* Smaller squares */
    height: 8px;
  }
}
```

```typescript
// Touch-friendly tooltips
const [touchTooltip, setTouchTooltip] = useState<{
  content: string;
  x: number;
  y: number;
} | null>(null);

const handleTouchStart = (event: TouchEvent, value: HeatmapValue) => {
  const touch = event.touches[0];
  setTouchTooltip({
    content: formatTooltipContent(value),
    x: touch.clientX,
    y: touch.clientY,
  });

  // Hide after 3 seconds
  setTimeout(() => setTouchTooltip(null), 3000);
};
```
