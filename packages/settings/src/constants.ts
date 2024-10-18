/* * */

export const SERVERDB_KEYS = Object.freeze({
	FACILITIES: {
		BOAT_STATIONS: 'facilities:boat_stations',
		HELPDESKS: 'facilities:helpdesks',
		LIGHT_RAIL_STATIONS: 'facilities:light_rail_stations',
		SCHOOLS: 'facilities:schools',
		STORES: 'facilities:stores',
		SUBWAY_STATIONS: 'facilities:subway_stations',
		TRAIN_STATIONS: 'facilities:train_stations',
	},
	LOCATIONS: {
		DISTRICTS: 'locations:districts',
		LOCALIITIES: 'locations:localities',
		MUNICIPALITIES: 'locations:municipalities',
		PARISHES: 'locations:parishes',
		REGIONS: 'locations:regions',
	},
	METRICS: {
		DEMAND: {
			BY_DAY: 'v2:metrics:demand:by_day',
			BY_LINE: 'v2:metrics:demand:by_line',
			BY_MONTH: 'v2:metrics:demand:by_month',
			BY_OPERATOR: 'v2:metrics:demand:operator',
			BY_STOP: 'v2:metrics:demand:by_stop',
		},
		SERVICE: {
			ALL: 'v2:metrics:service',
		},
	},
	NETWORK: {
		ALERTS: {
			ALL: 'v2:network:alerts:all',
			PROTOBUF: 'v2:network:alerts:protobuf',
			SENT_NOTIFICATIONS: 'v2:network:alerts:sent_notifications',
		},
		ARCHIVES: {
			ALL: 'v2:network:archives:all',
		},
		DATES: {
			ALL: 'v2:network:dates:all',
		},
		LINES: {
			ALL: 'v2:network:lines:all',
		},
		PATTERNS: {
			ID: id => `v2:network:patterns:${id}`,
		},
		PERIODS: {
			ALL: 'v2:network:periods:all',
		},
		ROUTES: {
			ALL: 'v2:network:routes:all',
		},
		SHAPES: {
			BASE: 'v2:network:shapes',
			ID: id => `v2:network:shapes:${id}`,
		},
		STOPS: {
			ALL: 'v2:network:stops:all',
			BASE: 'v2:network:stops',
		},
		VEHICLES: {
			ALL: 'v2:network:vehicles:all',
			PROTOBUF: 'v2:network:vehicles:protobuf',
		},
	},
	PIP: 'v2:pip',
});
