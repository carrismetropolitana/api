module.exports = [
  //

  //
  // MUNICIPALITIES
  {
    file_name: 'municipalities',
    file_extension: 'txt',
    file_headers: ['municipality_prefix', 'municipality_id', 'municipality_name', 'district_id', 'district_name', 'region_id', 'region_name'],
    table_query: `CREATE TABLE municipalities (
        municipality_prefix VARCHAR(2),
        municipality_id VARCHAR(4),
        municipality_name VARCHAR(255),
        district_id VARCHAR(255),
        district_name VARCHAR(255),
        region_id VARCHAR(255),
        region_name VARCHAR(255)
    );`,
    index_queries: ['CREATE INDEX municipalities_municipality_id_idx ON municipalities ("municipality_id");'],
    raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_EXTRACTED_DIR}`,
    prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
  },

  //
  // FACILITIES
  {
    file_name: 'facilities',
    file_extension: 'txt',
    file_headers: [
      'facility_id',
      'facility_type',
      'facility_name',
      'facility_lat',
      'facility_lon',
      'facility_phone',
      'facility_email',
      'facility_url',
      'address',
      'postal_code',
      'locality',
      'parish_id',
      'parish_name',
      'municipality_id',
      'municipality_name',
      'district_id',
      'district_name',
      'region_id',
      'region_name',
      'facility_stops',
    ],
    table_query: `CREATE TABLE facilities (
        facility_id VARCHAR(255),
        facility_type VARCHAR(255),
        facility_name VARCHAR(255),
        facility_lat VARCHAR(255),
        facility_lon VARCHAR(255),
        facility_phone VARCHAR(255),
        facility_email VARCHAR(255),
        facility_url VARCHAR(255),
        address VARCHAR(255),
        postal_code VARCHAR(255),
        locality VARCHAR(255),
        parish_id VARCHAR(255),
        parish_name VARCHAR(255), 
        municipality_id VARCHAR(255),
        municipality_name VARCHAR(255),
        district_id VARCHAR(255),
        district_name VARCHAR(255),
        region_id VARCHAR(255),
        region_name VARCHAR(255),
        facility_stops VARCHAR(255)
    );`,
    index_queries: ['CREATE INDEX facilities_facility_id_idx ON facilities ("facility_id");'],
    raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_EXTRACTED_DIR}`,
    prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
  },

  //
  // HELPDESKS
  {
    file_name: 'helpdesks',
    file_extension: 'txt',
    file_headers: [
      'helpdesk_id',
      'helpdesk_type',
      'helpdesk_name',
      'helpdesk_lat',
      'helpdesk_lon',
      'helpdesk_phone',
      'helpdesk_email',
      'helpdesk_url',
      'address',
      'postal_code',
      'locality',
      'parish_id',
      'parish_name',
      'municipality_id',
      'municipality_name',
      'district_id',
      'district_name',
      'region_id',
      'region_name',
      'hours_monday',
      'hours_tuesday',
      'hours_wednesday',
      'hours_thursday',
      'hours_friday',
      'hours_saturday',
      'hours_sunday',
      'hours_special',
      'helpdesk_stops',
    ],
    table_query: `CREATE TABLE helpdesks (
        helpdesk_id VARCHAR(255),
        helpdesk_type VARCHAR(255),
        helpdesk_name VARCHAR(255),
        helpdesk_lat VARCHAR(255),
        helpdesk_lon VARCHAR(255),
        helpdesk_phone VARCHAR(255),
        helpdesk_email VARCHAR(255),
        helpdesk_url VARCHAR(255),
        address VARCHAR(255),
        postal_code VARCHAR(255),
        locality VARCHAR(255),
        parish_id VARCHAR(255),
        parish_name VARCHAR(255),
        municipality_id VARCHAR(255),
        municipality_name VARCHAR(255),
        district_id VARCHAR(255),
        district_name VARCHAR(255),
        region_id VARCHAR(255),
        region_name VARCHAR(255),
        hours_monday VARCHAR(255),
        hours_tuesday VARCHAR(255),
        hours_wednesday VARCHAR(255),
        hours_thursday VARCHAR(255),
        hours_friday VARCHAR(255),
        hours_saturday VARCHAR(255),
        hours_sunday VARCHAR(255),
        hours_special VARCHAR(255),
        helpdesk_stops VARCHAR(255)
    );`,
    index_queries: ['CREATE INDEX helpdesks_helpdesk_id_idx ON helpdesks ("helpdesk_id");'],
    raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_EXTRACTED_DIR}`,
    prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
  },

  //
  // CALENDAR_DATES
  {
    file_name: 'calendar_dates',
    file_extension: 'txt',
    file_headers: ['service_id', 'date'],
    table_query: `CREATE TABLE calendar_dates (
        service_id VARCHAR(255),
        date VARCHAR(8)
    );`,
    index_queries: ['CREATE INDEX calendar_dates_service_id_idx ON calendar_dates ("service_id");'],
    raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_EXTRACTED_DIR}`,
    prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
  },

  //
  // ROUTES
  {
    file_name: 'routes',
    file_extension: 'txt',
    file_headers: ['route_id', 'route_short_name', 'route_long_name', 'route_type', 'route_color', 'route_text_color'],
    table_query: `CREATE TABLE routes (
        route_id VARCHAR(10),
        route_short_name VARCHAR(10),
        route_long_name VARCHAR(255),
        route_type VARCHAR(255),
        route_color VARCHAR(6),
        route_text_color VARCHAR(6)
    );`,
    index_queries: ['CREATE INDEX routes_route_id_idx ON routes ("route_id");'],
    raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_EXTRACTED_DIR}`,
    prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
  },

  //
  // SHAPES
  {
    file_name: 'shapes',
    file_extension: 'txt',
    file_headers: ['shape_id', 'shape_pt_lat', 'shape_pt_lon', 'shape_pt_sequence', 'shape_dist_traveled'],
    table_query: `CREATE TABLE shapes (
        shape_id VARCHAR(255),
        shape_pt_lat FLOAT(6),
        shape_pt_lon FLOAT(6),
        shape_pt_sequence SMALLINT,
        shape_dist_traveled FLOAT(6)
    );`,
    index_queries: ['CREATE INDEX shapes_shape_id_idx ON shapes ("shape_id");'],
    raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_EXTRACTED_DIR}`,
    prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
  },

  //
  // TRIPS
  {
    file_name: 'trips',
    file_extension: 'txt',
    file_headers: ['route_id', 'pattern_id', 'service_id', 'trip_id', 'trip_headsign', 'direction_id', 'shape_id'],
    table_query: `CREATE TABLE trips (
        route_id VARCHAR(255),
        pattern_id VARCHAR(255),
        service_id VARCHAR(255),
        trip_id VARCHAR(255),
        trip_headsign VARCHAR(255),
        direction_id SMALLINT,
        shape_id VARCHAR(255)
    );`,
    index_queries: ['CREATE INDEX trips_route_id_idx ON trips ("route_id");', 'CREATE INDEX trips_route_id_service_id_idx ON trips ("route_id", "service_id");'],
    raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_EXTRACTED_DIR}`,
    prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
  },

  //
  // STOP_TIMES
  {
    file_name: 'stop_times',
    file_extension: 'txt',
    file_headers: ['trip_id', 'arrival_time', 'stop_id', 'stop_sequence', 'shape_dist_traveled'],
    table_query: `CREATE TABLE stop_times (
        trip_id VARCHAR(255),
        arrival_time VARCHAR(8),
        stop_id VARCHAR(6),
        stop_sequence SMALLINT,
        shape_dist_traveled VARCHAR(255)
    );`,
    index_queries: ['CREATE INDEX stop_times_trip_id_idx ON stop_times ("trip_id");', 'CREATE INDEX stop_times_stop_id_idx ON stop_times ("stop_id");'],
    raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_EXTRACTED_DIR}`,
    prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
  },

  //
  // STOPS
  {
    file_name: 'stops',
    file_extension: 'txt',
    file_headers: [
      'stop_id',
      'stop_name',
      'stop_short_name',
      'tts_stop_name',
      'stop_lat',
      'stop_lon',
      'locality',
      'parish_id',
      'parish_name',
      'municipality_id',
      'municipality_name',
      'district_id',
      'district_name',
      'region_id',
      'region_name',
      'wheelchair_boarding',
      'near_health_clinic',
      'near_hospital',
      'near_university',
      'near_school',
      'near_police_station',
      'near_fire_station',
      'near_shopping',
      'near_historic_building',
      'near_transit_office',
      'light_rail',
      'subway',
      'train',
      'boat',
      'airport',
      'bike_sharing',
      'bike_parking',
      'car_parking',
    ],
    table_query: `CREATE TABLE stops (
        stop_id VARCHAR(6),
        stop_name VARCHAR(255),
        stop_short_name VARCHAR(255),
        tts_stop_name VARCHAR(255),
        stop_lat VARCHAR(10),
        stop_lon VARCHAR(10),
        locality VARCHAR(255),
        parish_id VARCHAR(255),
        parish_name VARCHAR(255),
        municipality_id VARCHAR(255),
        municipality_name VARCHAR(255),
        district_id VARCHAR(255),
        district_name VARCHAR(255),
        region_id VARCHAR(255),
        region_name VARCHAR(255),
        wheelchair_boarding VARCHAR(1),
        near_health_clinic BOOLEAN,
        near_hospital BOOLEAN,
        near_university BOOLEAN,
        near_school BOOLEAN,
        near_police_station BOOLEAN,
        near_fire_station BOOLEAN,
        near_shopping BOOLEAN,
        near_historic_building BOOLEAN,
        near_transit_office BOOLEAN,
        light_rail BOOLEAN,
        subway BOOLEAN,
        train BOOLEAN,
        boat BOOLEAN,
        airport BOOLEAN,
        bike_sharing BOOLEAN,
        bike_parking BOOLEAN,
        car_parking BOOLEAN
    );`,
    index_queries: ['CREATE INDEX stops_stop_id_idx ON stops ("stop_id");'],
    raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_EXTRACTED_DIR}`,
    prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
  },

  //
];
