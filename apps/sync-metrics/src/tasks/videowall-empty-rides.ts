/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/services/interfaces';
import { getOperationalDate } from '@tmlmobilidade/services/utils';
import { DateTime } from 'luxon';

/* * */

export const videowallEmptyRides = async () => {
	//

	LOGGER.title(`Videowall - Empty Rides`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup timestamp boundaries

	const operationalDate = getOperationalDate();

	//
	// Setup the response JSON object

	const responseResult = {

		// For Area 1
		_41_empty_rides_count: 0,
		_41_empty_rides_vkm: 0,

		// For Area 2
		_42_empty_rides_count: 0,
		_42_empty_rides_vkm: 0,

		// For Area 3
		_43_empty_rides_count: 0,
		_43_empty_rides_vkm: 0,

		// For Area 4
		_44_empty_rides_count: 0,
		_44_empty_rides_vkm: 0,

		// For the whole CM
		_cm_empty_rides_count: 0,
		_cm_empty_rides_vkm: 0,

		//
	};

	//
	// Get all rides for today

	const ridesCollection = await rides.getCollection();
	const allRidesForTodayStream = ridesCollection.find({ operational_date: operationalDate }).stream();

	//
	// Iterate on all rides for today

	for await (const rideData of allRidesForTodayStream) {
		//

		//
		// Only consider rides that have already started (schedule start before now)
		// or have already been processed.

		const rideStartedBeforeNow = DateTime.fromJSDate(rideData.start_time_scheduled).toMillis() < DateTime.now().minus({ minutes: 60 }).toMillis();

		const rideHasBeenProcessed = rideData.status === 'complete' && rideData.analysis.length > 0;

		if (!rideStartedBeforeNow || !rideHasBeenProcessed) continue;

		//
		// Check if the ride is delayed for more than five minutes
		// and store the total delay for each area and for the whole CM

		const relevantTest = rideData.analysis.find(item => item._id === 'SIMPLE_ONE_VALIDATION_TRANSACTION');

		if (!relevantTest) continue;

		if (relevantTest.grade === 'fail') {
			//
			responseResult._cm_empty_rides_count++;
			if (rideData.agency_id === '41') responseResult._41_empty_rides_count++;
			if (rideData.agency_id === '42') responseResult._42_empty_rides_count++;
			if (rideData.agency_id === '43') responseResult._43_empty_rides_count++;
			if (rideData.agency_id === '44') responseResult._44_empty_rides_count++;
			//
			responseResult._cm_empty_rides_vkm += rideData.extension_scheduled;
			if (rideData.agency_id === '41') responseResult._41_empty_rides_vkm += rideData.extension_scheduled;
			if (rideData.agency_id === '42') responseResult._42_empty_rides_vkm += rideData.extension_scheduled;
			if (rideData.agency_id === '43') responseResult._43_empty_rides_vkm += rideData.extension_scheduled;
			if (rideData.agency_id === '44') responseResult._44_empty_rides_vkm += rideData.extension_scheduled;
		}

		//
	}

	//
	// Save items to the database

	const chacheableResource: CachedResource<typeof responseResult> = {
		data: responseResult,
		timestamp_resource: DateTime.now().toMillis(),
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.EMPTY_RIDES, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.EMPTY_RIDES} (${globalTimer.get()}).`);

	//
};
