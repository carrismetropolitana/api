/* * */

export const RUN_INTERVAL = 300000; // 5 minutes

/* * */

export const ENABLED_MODULES = [
	'gtfs_import',
	'municipalities_parser',
	'localities_parser',
	'periods_parser',
	'dates_parser',
	'stops_parser',
	'shapes_parser',
	'lines_routes_patterns_parser',
	'timetables_parser',
];

/* * */

export const BASE_DIR = '/tmp/base';
export const GTFS_BASE_DIR = 'gtfs';
export const GTFS_RAW_DIR = 'raw';
export const GTFS_PREPARED_DIR = 'prepared';
export const NETEX_BASE_DIR = 'netex';
export const NETEX_RAW_DIR = 'raw';
export const NETEX_PREPARED_DIR = 'prepared';