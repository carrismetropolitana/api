/* * */

export const SERVERDB_KEYS = Object.freeze({
	FACILITIES: {
		BOAT_STATIONS: 'facilities:boat_stations',
		HELPDESKS: 'facilities:helpdesks',
		LIGHT_RAIL_STATIONS: 'facilities:light_rail_stations',
		PIPS: 'facilities:pips',
		SCHOOLS: 'facilities:schools',
		STORES: 'facilities:stores',
		SUBWAY_STATIONS: 'facilities:subway_stations',
		TRAIN_STATIONS: 'facilities:train_stations',
	},
	LOCATIONS: {
		DISTRICTS: 'locations:districts',
		LOCALITIES: 'locations:localities',
		MUNICIPALITIES: 'locations:municipalities',
		PARISHES: 'locations:parishes',
		REGIONS: 'locations:regions',
	},
	METRICS: {
		ALERTS: {
			ALL: 'metrics:alerts:all',
			BY_MUNICIPALITY: 'metrics:alerts:by_municipality',
			CAUSE_EFFECT: 'metrics:alerts:cause_effect',
			EVOLUTION: 'metrics:alerts:evolution',
			SUMMARY: 'metrics:alerts:summary',
		},
		COMPLAINTS: 'metrics:complaints',
		DEMAND: {
			BY_AGENCY: {
				DAY: 'metrics:demand:agency:day',
				MONTH: 'metrics:demand:agency:month',
				RECORDS: 'metrics:demand:agency:records',
				YEAR: 'metrics:demand:agency:year',
			},
			BY_LINE: 'metrics:demand:by_line',
			BY_STOP: 'metrics:demand:by_stop',
		},
		SERVICE: 'metrics:service',
		VIDEOWALL: {
			DELAYS: 'metrics:videowall:delays',
			EMPTY_RIDES: 'metrics:videowall:empty_rides',
			SLA: 'metrics:videowall:sla',
			VALIDATIONS: 'metrics:videowall:validations',
			VKM: 'metrics:videowall:vkm',
		},
	},
	NETWORK: {
		ALERTS: {
			ALL: 'network:alerts:all',
			PROTOBUF: 'network:alerts:protobuf',
			SENT_NOTIFICATIONS: 'network:alerts:sent_notifications',
		},
		DATES: 'network:dates',
		LINES: 'network:lines',
		PATTERNS: {
			BASE: 'network:patterns',
			ID: id => `network:patterns:${id}`,
		},
		PERIODS: 'network:periods',
		PLANS: 'network:plans',
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
});
