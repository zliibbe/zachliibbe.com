"use client";

import React, { SVGProps } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import styles from "./ActivityGrid.module.css";
import moment from "moment";
import { StravaActivity } from "@/lib/strava/types";
import { ReactCalendarHeatmapValue } from "react-calendar-heatmap";
import { getTimeAgo } from "@/app/utils";

interface ActivityGridProps {
  activities: StravaActivity[];
}

interface HeatmapValue extends ReactCalendarHeatmapValue<string> {
  type: string;
  name: string;
  distance?: number;
  moving_time?: number;
}

export default function ActivityGrid({ activities }: ActivityGridProps) {
  if (!activities?.length) {
    return <div className={styles.errorState}>No activities found</div>;
  }

  const values = activities.map((activity) => {
    const formattedActivity = {
      date: activity.start_date,
      count: 1,
      type: activity.type.toLowerCase(),
      name: activity.name,
      distance: activity.distance,
      moving_time: activity.moving_time,
    };
    return formattedActivity;
  });

  const getClassForValue = (value: any): string => {
    if (!value || !value.type) {
      return styles.colorEmpty;
    }

    const type = value.type.toLowerCase();

    switch (type) {
      case "run":
        return styles.colorRun;
      case "ride":
        return styles.colorRide;
      case "swim":
        return styles.colorSwim;
      case "alpineski":
        return styles.colorAlpineski;
      case "hike":
        return styles.colorHike;
      case "walk":
        return styles.colorWalk;
      case "weighttraining":
        return styles.colorWeighttraining;
      default:
        return styles.colorEmpty;
    }
  };

  const legendItems = [
    { type: "Run", className: styles.legendRun },
    { type: "Bike Ride", className: styles.legendRide },
    { type: "Swim", className: styles.legendSwim },
    { type: "Ski", className: styles.legendAlpineski },
    { type: "Hike", className: styles.legendHike },
    { type: "Walk", className: styles.legendWalk },
    { type: "Weight Training", className: styles.legendWeighttraining },
    { type: "No Activity", className: styles.legendEmpty },
  ];

  // Helper function to format distance/duration based on activity type
  const formatActivityMetric = (value: HeatmapValue): string => {
    if (!value.distance && !value.moving_time) {
      return "No data";
    }

    const type = value.type.toLowerCase();

    if (type === "weighttraining" && value.moving_time) {
      const minutes = Math.round(value.moving_time / 60);
      return `${minutes} minutes`;
    }

    if (type === "swim" && value.distance) {
      const yards = Math.round(value.distance * 1.09361);
      return `${yards} yards`;
    }

    if (value.distance) {
      const miles = (value.distance * 0.000621371).toFixed(1);
      return `${miles} miles`;
    }

    return "No data";
  };

  return (
    <>
      <div className={styles.legend}>
        {legendItems.map((item) => (
          <div key={item.type} className={styles.legendItem}>
            <div className={`${styles.legendBox} ${item.className}`} />
            <span>{item.type}</span>
          </div>
        ))}
      </div>
      <div className={styles.gridContainer}>
        <CalendarHeatmap
          startDate={moment().subtract(11, "months").toDate()}
          endDate={moment().toDate()}
          values={values}
          classForValue={getClassForValue}
          titleForValue={(
            value: ReactCalendarHeatmapValue<string> | undefined,
          ) => {
            if (!value) return "No activity";
            const val = value as HeatmapValue;
            const metric = formatActivityMetric(val);
            const timeAgo = getTimeAgo(val.date);
            return `${val.name} - ${metric} on ${moment(val.date).format("MMMM D, YYYY")} (${timeAgo})`;
          }}
          showWeekdayLabels={true}
          weekdayLabels={["M", "T", "W", "Th", "F", "Sa", "Su"]}
          horizontal={true}
          gutterSize={2}
          transformDayElement={(element, value) => {
            if (!element) return null;
            return React.cloneElement(element as React.ReactElement, {
              ...element,
              rx: 3,
              ry: 3,
              "data-tip": true,
            });
          }}
        />
      </div>
    </>
  );
}
