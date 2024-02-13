
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
};

type GTFSStopTime = {
  trip_id: string;
  arrival_time: string;
  stop_id: string;
  stop_sequence: number;
  shape_dist_traveled: string;
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