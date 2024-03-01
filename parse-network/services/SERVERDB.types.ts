import { Facility } from '../parsers/timetableExample';

type GTFSMunicipality = {
  municipality_prefix: string;
  municipality_id: string;
  municipality_name: string;
  district_id: string;
  district_name: string;
  region_id: string;
  region_name: string;
};

type GTFSPeriod = {
  period_id: string;
  period_name: string;
};

type GTFSDate = {
  date: string;
  period: string;
  day_type: string;
  holiday: string;
  description: string;
};

type GTFSCalendarDate = {
  service_id: string;
  date: string;
  period: string;
  day_type: string;
  holiday: string;
};

type GTFSRoute = {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
  route_color: string;
  route_text_color: string;
};

type GTFSShape = {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled: number;
};

type GTFSTrip = {
  route_id: string;
  pattern_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign: string;
  direction_id: number;
  shape_id: string;
  calendar_desc: string;
};

type GTFSStopTime = {
  trip_id: string;
  arrival_time: string;
  stop_id: string;
  stop_sequence: number;
  shape_dist_traveled: string;
  pickup_type: string;
  drop_off_type: string;
};

type GTFSStop = {
  stop_id: string;
  stop_name: string;
  stop_short_name: string;
  tts_stop_name: string;
  stop_lat: string;
  stop_lon: string;
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
  near_health_clinic: boolean;
  near_hospital: boolean;
  near_university: boolean;
  near_school: boolean;
  near_police_station: boolean;
  near_fire_station: boolean;
  near_shopping: boolean;
  near_historic_building: boolean;
  near_transit_office: boolean;
  light_rail: boolean;
  subway: boolean;
  train: boolean;
  boat: boolean;
  airport: boolean;
  bike_sharing: boolean;
  bike_parking: boolean;
  car_parking: boolean;
};

export interface MonPattern {
  id: string
  line_id: string
  route_id: string
  short_name: string
  direction: number
  headsign: string
  color: string
  text_color: string
  valid_on: string[]
  municipalities: string[]
  localities: string[]
  facilities: Facility[]
  shape_id: string
  path: Path[]
  trips: Trip[]
}

export interface Path {
  Stop: Stop
  stop_sequence: number
  allow_pickup: boolean
  allow_drop_off: boolean
  distance_delta: number
}

export interface Stop {
  id: string
  name: string
  short_name: any
  tts_name: string
  lat: string
  lon: string
  locality: string
  parish_id: any
  parish_name: any
  municipality_id: string
  municipality_name: string
  district_id: string
  district_name: string
  region_id: string
  region_name: string
  wheelchair_boarding: any
  facilities: string[]
  lines: string[]
  routes: string[]
  patterns: string[]
}

export interface Trip {
  id: string
  calendar_id: string
  calendar_description: string
  dates: string[]
  schedule: Schedule[]
}

export interface Schedule {
  stop_id: string
  stop_sequence: number
  arrival_time: string
  arrival_time_operation: string
  travel_time: string
}