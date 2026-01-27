/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/interfaces';
import { type Ride } from '@tmlmobilidade/types';
import { Dates } from '@tmlmobilidade/dates';

/* * */

export const videowallEmptyRides = async () => {
	//

	LOGGER.title(`Videowall - Empty Rides`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup timestamp boundaries

	const operationalDate = Dates
		.now('Europe/Lisbon')
		.operational_date;

	const nowInUnixTimestamp = Dates
		.now('Europe/Lisbon')
		.unix_timestamp - 120_000; // 2 minutes ago

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
	const allRidesForTodayStream = ridesCollection.find({ operational_date: operationalDate, system_status: 'complete' }).stream();

	//
	// Iterate on all rides for today

	for await (const currentRide of allRidesForTodayStream) {
		//

		const rideData: Ride = currentRide as Ride;

		//
		// Skip rides that are not yet processed

		if (rideData.analysis === null) continue;

		//
		// Only consider rides that have already ended (seen_last_at is more than two minutes ago)

		if (!rideData.seen_last_at) continue;

		if (nowInUnixTimestamp - rideData.seen_last_at < 0) continue;

		//
		// Check if the ride had any valid validation transactions

		if (rideData.apex_validations_qty > 0) {
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
		timestamp_resource: Dates.now('Europe/Lisbon').unix_timestamp,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.EMPTY_RIDES, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.EMPTY_RIDES} (${globalTimer.get()}).`);

	//
};
