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
			BY_DAY: 'metrics:demand:by_day',
			BY_LINE: 'metrics:demand:by_line',
			BY_MONTH: 'metrics:demand:by_month',
			BY_OPERATOR: 'metrics:demand:operator',
			BY_STOP: 'metrics:demand:by_stop',
		},
		SERVICE: {
			ALL: 'metrics:service',
		},
	},
	NETWORK: {
		ALERTS: {
			ALL: 'network:alerts:all',
			PROTOBUF: 'network:alerts:protobuf',
			SENT_NOTIFICATIONS: 'network:alerts:sent_notifications',
		},
		ARCHIVES: 'network:archives',
		DATES: 'network:dates',
		LINES: 'network:lines',
		PATTERNS: {
			BASE: 'network:patterns',
			ID: id => `network:patterns:${id}`,
		},
		PERIODS: 'network:periods',
		ROUTES: 'network:routes',
		SHAPES: {
			BASE: 'network:shapes',
			ID: id => `network:shapes:${id}`,
		},
		STOPS: 'network:stops',
		VEHICLES: {
			ALL: 'network:vehicles:all',
			PROTOBUF: 'network:vehicles:protobuf',
		},
	},
	PIP: 'pip',
});
