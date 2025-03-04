export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  elapsed_time: number;
  start_date: string;
  moving_time: number;
  total_elevation_gain?: number;
}
