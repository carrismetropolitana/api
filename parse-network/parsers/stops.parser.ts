/* * */

import type { MonStop } from '@/services/NETWORKDB.types.js';

import collator from '@/modules/sortCollator.js';
import { getElapsedTime } from '@/modules/timeCalc.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

export default async () => {
	//
	// 1.
	// Record the start time to later calculate operation duration
	const startTime = process.hrtime();

	// 2.
	// Query Postgres for all unique stops by stop_id
	console.log(`⤷ Querying database...`);
	const allStops = await NETWORKDB.client.query<{
		airport: boolean
		bike_parking: boolean
		bike_sharing: boolean
		boat: boolean
		car_parking: boolean
		district_id: string
		district_name: string
		light_rail: boolean
		line_ids: string[]
		locality: string
		municipality_id: string
		municipality_name: string
		near_fire_station: boolean
		near_health_clinic: boolean
		near_historic_building: boolean
		near_hospital: boolean
		near_police_station: boolean
		near_school: boolean
		near_shopping: boolean
		near_transit_office: boolean
		near_university: boolean
		operational_status: string
		parish_id: string
		parish_name: string
		pattern_ids: string[]
		region_id: string
		region_name: string
		route_ids: string[]
		stop_id: string
		stop_lat: string
		stop_lon: string
		stop_name: string
		stop_short_name: string
		subway: boolean
		train: boolean
		tts_stop_name: string
		wheelchair_boarding: string
	}>(`
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

	// 3.
	// Log progress
	console.log(`⤷ Updating Stops...`);

	// 4.
	// Initate a temporary variable to hold updated Stops
	const allStopsData: MonStop[] = [
	];
	const updatedStopKeys = new Set();

	// 5.
	// For each stop, update its entry in the database
	for (const stop of allStops.rows) {
		// Discover which facilities this stop is near to
		const facilities = [
		];
		if (stop.near_health_clinic) { facilities.push('health_clinic'); }
		if (stop.near_hospital) { facilities.push('hospital'); }
		if (stop.near_university) { facilities.push('university'); }
		if (stop.near_school) { facilities.push('school'); }
		if (stop.near_police_station) { facilities.push('police_station'); }
		if (stop.near_fire_station) { facilities.push('fire_station'); }
		if (stop.near_shopping) { facilities.push('shopping'); }
		if (stop.near_historic_building) { facilities.push('historic_building'); }
		if (stop.near_transit_office) { facilities.push('transit_office'); }
		if (stop.subway) { facilities.push('subway'); }
		if (stop.light_rail) { facilities.push('light_rail'); }
		if (stop.train) { facilities.push('train'); }
		if (stop.boat) { facilities.push('boat'); }
		if (stop.airport) { facilities.push('airport'); }
		if (stop.bike_sharing) { facilities.push('bike_sharing'); }
		if (stop.bike_parking) { facilities.push('bike_parking'); }
		if (stop.car_parking) { facilities.push('car_parking'); }
		// Initiate a variable to hold the parsed stop
		const parsedStop = {
			district_id: stop.district_id,
			district_name: stop.district_name,
			facilities: facilities || [
			],
			id: stop.stop_id,
			lat: stop.stop_lat,
			lines: stop.line_ids || [
			],
			locality: stop.locality,
			lon: stop.stop_lon,
			municipality_id: stop.municipality_id,
			municipality_name: stop.municipality_name,
			name: stop.stop_name,
			operational_status: stop.operational_status,
			parish_id: stop.parish_id,
			parish_name: stop.parish_name,
			patterns: stop.pattern_ids || [
			],
			region_id: stop.region_id,
			region_name: stop.region_name,
			routes: stop.route_ids || [
			],
			short_name: stop.stop_short_name,
			tts_name: stop.tts_stop_name,
			wheelchair_boarding: stop.wheelchair_boarding,
		};
		// Update or create new document
		allStopsData.push(parsedStop);
		await SERVERDB.client.set(`stops:${parsedStop.id}`, JSON.stringify(parsedStop));
		updatedStopKeys.add(`stops:${parsedStop.id}`);
		//
	}

	// 6.
	// Log count of updated Stops
	console.log(`⤷ Updated ${updatedStopKeys.size} Stops.`);

	// 7.
	// Add the 'all' option
	allStopsData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('stops:all', JSON.stringify(allStopsData));
	updatedStopKeys.add('stops:all');

	// 8.
	// Delete all Stops not present in the current update
	const allSavedStopKeys = [
	];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'stops:*', TYPE: 'string' })) { allSavedStopKeys.push(key); }

	const staleStopKeys = allSavedStopKeys.filter(id => !updatedStopKeys.has(id));
	if (staleStopKeys.length) { await SERVERDB.client.del(staleStopKeys); }
	console.log(`⤷ Deleted ${staleStopKeys.length} stale Stops.`);

	// 9.
	// Log elapsed time in the current operation
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Done updating Stops (${elapsedTime}).`);

	//
};
