/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type CachedResource } from '@carrismetropolitana/api-types/common';
import { type ServiceMetrics } from '@carrismetropolitana/api-types/metrics';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

const CM_AGENCY_IDS = ['LA77N', 'BNA17', 'YA15B', 'A2L1N'];

export const serviceMetrics = async () => {
	//

	LOGGER.title(`Sync Service Metrics`);
	const globalTimer = new TIMETRACKER();

	//
	// Query labdb for ride analysis

	const query = `
		SELECT
			r.agency_id,
			r.operational_date,
			countIf(
				a1.grade_status = 'pass'
				OR a3.grade_status = 'pass'
			) AS pass_trip_count,
			countIf(
				a1.grade_status = 'pass'
				OR a3.grade_status = 'pass'
			) / count() AS pass_trip_percentage,
			r.route_short_name,
			count() AS total_trip_count
		FROM operation.rides AS r FINAL

		LEFT JOIN
		(
			SELECT
				ride_id,
				argMax(grade_status, updated_at) AS grade_status
			FROM operation.ride_analysis_simple_one_apex_validation
			WHERE operational_date >= toYYYYMMDD(
				toDate(now('Europe/Lisbon')) - INTERVAL 15 DAY
			)
			AND operational_date <= toYYYYMMDD(
				toDate(now('Europe/Lisbon')) - INTERVAL 1 DAY
			)
			GROUP BY ride_id
		) AS a1
			ON a1.ride_id = r._id

		LEFT JOIN
		(
			SELECT
				ride_id,
				argMax(grade_status, updated_at) AS grade_status
			FROM operation.ride_analysis_simple_three_vehicle_events
			WHERE operational_date >= toYYYYMMDD(
				toDate(now('Europe/Lisbon')) - INTERVAL 15 DAY
			)
			AND operational_date <= toYYYYMMDD(
				toDate(now('Europe/Lisbon')) - INTERVAL 1 DAY
			)
			GROUP BY ride_id
		) AS a3
			ON a3.ride_id = r._id

		WHERE r.agency_id IN (
			'${CM_AGENCY_IDS.join('\', \'')}'
		)
		AND r.operational_date >= toYYYYMMDD(
			toDate(now('Europe/Lisbon')) - INTERVAL 15 DAY
		)
		AND r.operational_date <= toYYYYMMDD(
			toDate(now('Europe/Lisbon')) - INTERVAL 1 DAY
		)

		GROUP BY
			r.agency_id,
			r.operational_date,
			r.route_short_name

		ORDER BY
			r.operational_date,
			r.agency_id,
			r.route_short_name;
	`;

	console.log(query);

	const queryResult = await labDb.queryFromString<ServiceMetrics>(query);

	//
	// Fetch rides from 15 days ago

	// const yesterdayDate = Dates
	// 	.now('Europe/Lisbon')
	// 	.minus({ days: 1 });

	// const fifteenDaysAgoDate = Dates
	// 	.now('Europe/Lisbon')
	// 	.minus({ days: 15 });

	// const ridesCollection = await goDb.operation.rides.getCollection();

	// const ridesStream = ridesCollection.find({
	// 	agency_id: { $in: CM_AGENCY_IDS },
	// 	operational_date: { $gte: fifteenDaysAgoDate.operational_date_int, $lte: yesterdayDate.operational_date_int },
	// }).stream();

	// //
	// // Group rides by operational_date and line_id

	// const resultMap = new Map<string, ServiceMetrics>();

	// for await (const currentRide of ridesStream) {
	// 	//

	// 	const rideData = currentRide as Ride;

	// 	const resultMapKey = `${rideData.operational_date}-${rideData.route_short_name}`;

	// 	if (!resultMap.has(resultMapKey)) {
	// 		resultMap.set(resultMapKey, {
	// 			agency_id: rideData.agency_id,
	// 			operational_date: rideData.operational_date,
	// 			pass_trip_count: 0,
	// 			pass_trip_percentage: 0,
	// 			route_short_name: rideData.route_short_name,
	// 			total_trip_count: 0,
	// 		});
	// 	}

	// 	resultMap.get(resultMapKey).total_trip_count += 1;

	// 	if (!rideData.analysis) continue;

	// 	const simpleOneValidationTransactionTest = rideData.analysis.SIMPLE_ONE_APEX_VALIDATION;
	// 	const simpleThreeVehicleEventsTest = rideData.analysis.SIMPLE_THREE_VEHICLE_EVENTS;

	// 	if (simpleOneValidationTransactionTest?.grade === 'pass' || simpleThreeVehicleEventsTest?.grade === 'pass') {
	// 		resultMap.get(resultMapKey).pass_trip_count += 1;
	// 	}

	// 	resultMap.get(resultMapKey).pass_trip_percentage = resultMap.get(resultMapKey).pass_trip_count / resultMap.get(resultMapKey).total_trip_count;

	// 	//
	// }

	//
	// Save items to the database

	const chacheableResource: CachedResource<ServiceMetrics[]> = {
		data: queryResult,
		timestamp_resource: Dates.now('Europe/Lisbon').unix_milliseconds,
	};

	chacheableResource.data.sort((a, b) => sortCollator.compare(a.operational_date, b.operational_date));
	await SERVERDB.set(SERVERDB_KEYS.METRICS.SERVICE, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating ${chacheableResource.data.length} items to ${SERVERDB_KEYS.METRICS.SERVICE} (${globalTimer.get()}).`);

	//
};
