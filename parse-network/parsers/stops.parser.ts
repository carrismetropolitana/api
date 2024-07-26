/* * */

import collator from '@/modules/sortCollator.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

export default async () => {
	//

	const globalTimer = new TIMETRACKER();

	//
	// Fetch all Stops from NETWORKDB

	LOGGER.info(`Starting...`);
	const allStops = await NETWORKDB.client.query(`
		SELECT
			s.*,
			r.route_ids,
			r.line_ids,
			r.pattern_ids
		FROM
			stops s
		LEFT JOIN (
			SELECT
				stop_id,
				json_agg(DISTINCT r.route_short_name) AS line_ids,
				json_agg(DISTINCT r.route_id) AS route_ids,
				json_agg(DISTINCT t.pattern_id) AS pattern_ids
			FROM
				stop_times st
			JOIN
				trips t ON st.trip_id = t.trip_id
			JOIN
				routes r ON t.route_id = r.route_id
			GROUP BY
				stop_id
		) r ON s.stop_id = r.stop_id;
	`);

	//
	// Initate a temporary variable to hold updated items

	const allStopsData = [];
	const updatedStopKeys = new Set();

	//
	// For each item, update its entry in the database

	for (const stop of allStops.rows) {
		// Discover which facilities this stop is near to
		const facilities = [];
		if (stop.near_health_clinic) facilities.push('health_clinic');
		if (stop.near_hospital) facilities.push('hospital');
		if (stop.near_university) facilities.push('university');
		if (stop.near_school) facilities.push('school');
		if (stop.near_police_station) facilities.push('police_station');
		if (stop.near_fire_station) facilities.push('fire_station');
		if (stop.near_shopping) facilities.push('shopping');
		if (stop.near_historic_building) facilities.push('historic_building');
		if (stop.near_transit_office) facilities.push('transit_office');
		if (stop.subway) facilities.push('subway');
		if (stop.light_rail) facilities.push('light_rail');
		if (stop.train) facilities.push('train');
		if (stop.boat) facilities.push('boat');
		if (stop.airport) facilities.push('airport');
		if (stop.bike_sharing) facilities.push('bike_sharing');
		if (stop.bike_parking) facilities.push('bike_parking');
		if (stop.car_parking) facilities.push('car_parking');
		// Initiate a variable to hold the parsed stop
		const parsedStop = {
			district_id: stop.district_id,
			district_name: stop.district_name,
			facilities: facilities || [],
			id: stop.stop_id,
			lat: stop.stop_lat,
			lines: stop.line_ids || [],
			locality: stop.locality,
			lon: stop.stop_lon,
			municipality_id: stop.municipality_id,
			municipality_name: stop.municipality_name,
			name: stop.stop_name,
			operational_status: stop.operational_status,
			parish_id: stop.parish_id,
			parish_name: stop.parish_name,
			patterns: stop.pattern_ids || [],
			region_id: stop.region_id,
			region_name: stop.region_name,
			routes: stop.route_ids || [],
			short_name: stop.stop_short_name,
			stop_id: stop.stop_id,
			tts_name: stop.tts_stop_name,
			wheelchair_boarding: stop.wheelchair_boarding,
		};
		// Update or create new document
		allStopsData.push(parsedStop);
		await SERVERDB.client.set(`v2/network/stops/${parsedStop.id}`, JSON.stringify(parsedStop));
		updatedStopKeys.add(`v2/network/stops/${parsedStop.id}`);
	}

	LOGGER.info(`Updated ${updatedStopKeys.size} Stops`);

	//
	// Add the 'all' option

	allStopsData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('v2/network/stops/all', JSON.stringify(allStopsData));
	updatedStopKeys.add('v2/network/stops/all');

	//
	// Delete all items not present in the current update

	const allSavedStopKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'v2/network/stops/*', TYPE: 'string' })) {
		allSavedStopKeys.push(key);
	}

	const staleStopKeys = allSavedStopKeys.filter(id => !updatedStopKeys.has(id));
	if (staleStopKeys.length) {
		await SERVERDB.client.del(staleStopKeys);
	}

	LOGGER.info(`Deleted ${staleStopKeys.length} stale Stops`);

	//

	LOGGER.success(`Done updating Stops (${globalTimer.get()})`);

	//
};
