/* * */

export const SERVERDB_KEYS = Object.freeze({
	DATASETS: {
		CONNECTIONS_BOAT_STATIONS: 'v2:datasets:connections:boat_stations',
		CONNECTIONS_LIGHT_RAIL_STATIONS: 'v2:datasets:connections:light_rail_stations',
		CONNECTIONS_SUBWAY_STATIONS: 'v2:datasets:connections:subway_stations',
		CONNECTIONS_TRAIN_STATIONS: 'v2:datasets:connections:train_stations',
		FACILITIES_ENCM: 'v2:datasets:facilities:encm',
		FACILITIES_PIP: 'v2:datasets:facilities:pip',
		FACILITIES_SCHOOLS: 'v2:datasets:facilities:schools',
	},
	METRICS: {
		DEMAND_BY_DAY: 'v2:metrics:demand:by_day',
		DEMAND_BY_LINE: 'v2:metrics:demand:by_line',
		DEMAND_BY_MONTH: 'v2:metrics:demand:by_month',
		DEMAND_BY_STOP: 'v2:metrics:demand:by_stop',
		SERVICE: 'v2:metrics:service',
	},
	NETWORK: {
		ALERTS: 'v2:network:alerts',
		ALERTS_JSON: 'v2:network:alerts:json',
		ALERTS_PROTOBUF: 'v2:network:alerts:protobuf',
		ALERTS_SENT_NOTIFICATIONS: 'v2:network:alerts:sent_notifications',
		ARCHIVES: 'v2:network:archives',
		DATES: 'v2:network:dates',
		LINES: 'v2:network:lines',
		LOCALITIES: 'v2:network:localities',
		MUNICIPALITIES: 'v2:network:municipalities',
		PERIODS: 'v2:network:periods',
		ROUTES: 'v2:network:routes',
		STOPS: 'v2:network:stops',
		TIMETABLES: 'v2:network:timetables:index',
		VEHICLES: 'v2:network:vehicles',
		VEHICLES_JSON: 'v2:network:vehicles:json',
		VEHICLES_PROTOBUF: 'v2:network:vehicles:protobuf',
	},
	PIP: {
		ALL: 'v2:pip:all',
	},
});
