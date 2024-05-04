/* * */

export interface GTFSRoute {
  line_id: string;
  line_short_name: string;
  line_long_name: string;
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
  route_color: string;
  route_text_color: string;
}

/* * */

export interface GTFSDate {
  date: string;
  period: string;
  day_type: string;
  holiday: string;
  description: string;
}

/* * */

export interface GTFSPeriod {
  period_id: string;
  period_name: string;
}

/* * */

export interface GTFSCalendarDate {
  service_id: string;
  date: string;
  period: string;
  day_type: string;
  holiday: string;
}

/* * */

export interface GTFSTrip {
  route_id: string;
  pattern_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign: string;
  direction_id: number;
  shape_id: string;
  calendar_desc: string;
}

/* * */

export interface GTFSStopTime {
  trip_id: string;
  arrival_time: string;
  stop_id: string;
  stop_sequence: number;
  shape_dist_traveled: string;
  pickup_type: string;
  drop_off_type: string;
}

/* * */

export interface MonStop {
  id: string;
  name: string;
  short_name: string;
  tts_name: string;
  lat: string;
  lon: string;
  locality: string;
  parish_id: string;
  parish_name: string;
  municipality_id: string;
  municipality_name: string;
  district_id: string;
  district_name: string;
  region_id: string;
  region_name: string;
  wheelchair_boarding: string;
  facilities: string[];
  lines: string[];
  routes: string[];
  patterns: string[];
}

export interface MonPeriod {
  id: string;
  name: string;
  dates: string[];
  valid: {
    from: string;
    until?: string;
  }[];
}
