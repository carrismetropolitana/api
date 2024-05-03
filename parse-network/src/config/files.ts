/* * */

import { BASE_DIR, GTFS_BASE_DIR, GTFS_RAW_DIR, GTFS_PREPARED_DIR } from './settings';

/* * */

type File = {
	file_name: string;
	file_extension: string;
	file_headers: string[];
	table_query: string;
	index_queries: string[];
	raw_dir: string;
	prepared_dir: string;
};

const files: File[] = [
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
		raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}`,
		prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
	},

	//
	// PERIODS
	{
		file_name: 'periods',
		file_extension: 'txt',
		file_headers: ['period_id', 'period_name'],
		table_query: `CREATE TABLE periods (
        period_id VARCHAR(1),
        period_name VARCHAR(255)
    );`,
		index_queries: ['CREATE INDEX periods_period_id_idx ON periods ("period_id");'],
		raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}`,
		prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
	},

	//
	// DATES
	{
		file_name: 'dates',
		file_extension: 'txt',
		file_headers: ['date', 'period', 'day_type', 'holiday', 'description'],
		table_query: `CREATE TABLE dates (
        date VARCHAR(8),
        period VARCHAR(1),
        day_type VARCHAR(1),
        holiday VARCHAR(1),
        description VARCHAR(255)
    );`,
		index_queries: ['CREATE INDEX dates_date_idx ON dates ("date");'],
		raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}`,
		prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
	},

	//
	// PLANS
	{
		file_name: 'plans',
		file_extension: 'txt',
		file_headers: ['plan_id', 'operator_id', 'plan_start_date', 'plan_end_date'],
		table_query: `CREATE TABLE plans (
        plan_id VARCHAR(10),
        operator_id VARCHAR(2),
        plan_start_date VARCHAR(8),
        plan_end_date VARCHAR(8)
    );`,
		index_queries: ['CREATE INDEX plans_plan_id_idx ON plans ("plan_id");'],
		raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}`,
		prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
	},

	//
	// CALENDAR_DATES
	{
		file_name: 'calendar_dates',
		file_extension: 'txt',
		file_headers: ['service_id', 'date', 'period', 'day_type', 'holiday', 'exception_type'],
		table_query: `CREATE TABLE calendar_dates (
        service_id VARCHAR(255),
        date VARCHAR(8),
        period VARCHAR(1),
        day_type VARCHAR(1),
        holiday VARCHAR(1),
        exception_type VARCHAR(1)
    );`,
		index_queries: ['CREATE INDEX calendar_dates_service_id_idx ON calendar_dates ("service_id");'],
		raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}`,
		prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
	},

	//
	// ROUTES
	{
		file_name: 'routes',
		file_extension: 'txt',
		file_headers: ['route_id', 'route_short_name', 'route_long_name', 'route_type', 'route_color', 'route_text_color', 'line_id'],
		table_query: `CREATE TABLE routes (
        route_id VARCHAR(10),
        route_short_name VARCHAR(10),
        route_long_name VARCHAR(255),
        route_type VARCHAR(255),
        route_color VARCHAR(6),
        route_text_color VARCHAR(6),
				line_id VARCHAR(10)
    );`,
		index_queries: ['CREATE INDEX routes_route_id_idx ON routes ("route_id");'],
		raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}`,
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
		raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}`,
		prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
	},

	//
	// TRIPS
	{
		file_name: 'trips',
		file_extension: 'txt',
		file_headers: ['route_id', 'pattern_id', 'service_id', 'trip_id', 'trip_headsign', 'direction_id', 'shape_id', 'calendar_desc'],
		table_query: `CREATE TABLE trips (
        route_id VARCHAR(255),
        pattern_id VARCHAR(255),
        service_id VARCHAR(255),
        trip_id VARCHAR(255),
        trip_headsign VARCHAR(255),
        direction_id SMALLINT,
        shape_id VARCHAR(255),
        calendar_desc VARCHAR(255)
    );`,
		index_queries: ['CREATE INDEX trips_route_id_idx ON trips ("route_id");',
			'CREATE INDEX trips_route_id_service_id_idx ON trips ("route_id", "service_id");',
			'CREATE INDEX trips_pattern_id_idx ON trips (pattern_id);'],
		raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}`,
		prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
	},

	//
	// STOP_TIMES
	{
		file_name: 'stop_times',
		file_extension: 'txt',
		file_headers: ['trip_id', 'arrival_time', 'stop_id', 'stop_sequence', 'shape_dist_traveled', 'pickup_type', 'drop_off_type'],
		table_query: `CREATE TABLE stop_times (
        trip_id VARCHAR(255),
        arrival_time VARCHAR(8),
        stop_id VARCHAR(6),
        stop_sequence SMALLINT,
        shape_dist_traveled VARCHAR(255),
        pickup_type VARCHAR(1),
        drop_off_type VARCHAR(1)
    );`,
		index_queries: ['CREATE INDEX stop_times_trip_id_idx ON stop_times ("trip_id");',
			'CREATE INDEX stop_times_stop_id_idx ON stop_times ("stop_id");'],
		raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}`,
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
			'operational_status',
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
        operational_status VARCHAR(255),
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
		raw_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_RAW_DIR}`,
		prepared_dir: `${BASE_DIR}/${GTFS_BASE_DIR}/${GTFS_PREPARED_DIR}`,
	},

	//
];
export default files;