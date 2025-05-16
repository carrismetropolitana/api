/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/interfaces';
import { Dates } from '@tmlmobilidade/utils';
import { DateTime } from 'luxon';

/* * */

export const videowallVkm = async () => {
	//

	LOGGER.title(`Videowall - VKM`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup timestamp boundaries

	const operationalDate = Dates
		.now()
		.setZone('Europe/Lisbon')
		.operational_date;

	//
	// Setup the response JSON object

	const responseResult = {

		// For Area 1
		_41_scheduled_vkm_until_now: 0,
		_41_simple_one_validation_transaction_vkm_until_now: 0,
		_41_simple_three_events_or_simple_one_validation_transaction_vkm_until_now: 0,
		_41_simple_three_events_vkm_until_now: 0,

		// For Area 2
		_42_scheduled_vkm_until_now: 0,
		_42_simple_one_validation_transaction_vkm_until_now: 0,
		_42_simple_three_events_or_simple_one_validation_transaction_vkm_until_now: 0,
		_42_simple_three_events_vkm_until_now: 0,

		// For Area 3
		_43_scheduled_vkm_until_now: 0,
		_43_simple_one_validation_transaction_vkm_until_now: 0,
		_43_simple_three_events_or_simple_one_validation_transaction_vkm_until_now: 0,
		_43_simple_three_events_vkm_until_now: 0,

		// For Area 4
		_44_scheduled_vkm_until_now: 0,
		_44_simple_one_validation_transaction_vkm_until_now: 0,
		_44_simple_three_events_or_simple_one_validation_transaction_vkm_until_now: 0,
		_44_simple_three_events_vkm_until_now: 0,

		// For the whole CM
		_cm_scheduled_vkm_until_now: 0,
		_cm_simple_one_validation_transaction_vkm_until_now: 0,
		_cm_simple_three_events_or_simple_one_validation_transaction_vkm_until_now: 0,
		_cm_simple_three_events_vkm_until_now: 0,

		//
	};

	//
	// Get all rides for today

	const ridesCollection = await rides.getCollection();
	const allRidesForTodayStream = ridesCollection.find({ operational_date: operationalDate, system_status: 'complete' }).stream();

	//
	// Iterate on all rides for today

	for await (const rideData of allRidesForTodayStream) {
		//

		//
		// Skip rides that should not have started yet (scheduled for the future)

		const rideShouldHaveStarted = DateTime.fromMillis(rideData.start_time_scheduled).diffNow('minutes').minutes < -5;

		if (!rideShouldHaveStarted) continue;

		//
		// If a ride should have already started, but we still
		// do not have any data about it, we should count it as FAIL.

		responseResult._cm_scheduled_vkm_until_now += rideData.extension_scheduled;
		if (rideData.agency_id === '41') responseResult._41_scheduled_vkm_until_now += rideData.extension_scheduled;
		if (rideData.agency_id === '42') responseResult._42_scheduled_vkm_until_now += rideData.extension_scheduled;
		if (rideData.agency_id === '43') responseResult._43_scheduled_vkm_until_now += rideData.extension_scheduled;
		if (rideData.agency_id === '44') responseResult._44_scheduled_vkm_until_now += rideData.extension_scheduled;

		if (!rideData.seen_first_at) continue;

		//
		// If a ride should have already started and has already ended,
		// and failed the SIMPLE_THREE_VEHICLE_EVENTS test, then we should count it as FAIL.

		const rideHasAlreadyEnded = rideData.seen_last_at && DateTime.fromMillis(rideData.seen_last_at).diffNow('minutes').minutes < -2;
		const simpleThreeVehicleEvents = rideData.analysis.find(item => item._id === 'SIMPLE_THREE_VEHICLE_EVENTS');
		const simpleOneValidationTransaction = rideData.analysis.find(item => item._id === 'SIMPLE_ONE_VALIDATION_TRANSACTION');

		// Skip if ride has not yet ended

		if (!rideHasAlreadyEnded) continue;

		if (simpleThreeVehicleEvents.grade === 'pass') {
			responseResult._cm_simple_three_events_vkm_until_now += rideData.extension_scheduled;
			if (rideData.agency_id === '41') responseResult._41_simple_three_events_vkm_until_now += rideData.extension_scheduled;
			if (rideData.agency_id === '42') responseResult._42_simple_three_events_vkm_until_now += rideData.extension_scheduled;
			if (rideData.agency_id === '43') responseResult._43_simple_three_events_vkm_until_now += rideData.extension_scheduled;
			if (rideData.agency_id === '44') responseResult._44_simple_three_events_vkm_until_now += rideData.extension_scheduled;
		}

		if (simpleOneValidationTransaction.grade === 'pass') {
			responseResult._cm_simple_one_validation_transaction_vkm_until_now += rideData.extension_scheduled;
			if (rideData.agency_id === '41') responseResult._41_simple_one_validation_transaction_vkm_until_now += rideData.extension_scheduled; ;
			if (rideData.agency_id === '42') responseResult._42_simple_one_validation_transaction_vkm_until_now += rideData.extension_scheduled; ;
			if (rideData.agency_id === '43') responseResult._43_simple_one_validation_transaction_vkm_until_now += rideData.extension_scheduled; ;
			if (rideData.agency_id === '44') responseResult._44_simple_one_validation_transaction_vkm_until_now += rideData.extension_scheduled; ;
		}

		if (simpleThreeVehicleEvents.grade === 'pass' || simpleOneValidationTransaction.grade === 'pass') {
			responseResult._cm_simple_three_events_or_simple_one_validation_transaction_vkm_until_now += rideData.extension_scheduled;
			if (rideData.agency_id === '41') responseResult._41_simple_three_events_or_simple_one_validation_transaction_vkm_until_now += rideData.extension_scheduled; ;
			if (rideData.agency_id === '42') responseResult._42_simple_three_events_or_simple_one_validation_transaction_vkm_until_now += rideData.extension_scheduled; ;
			if (rideData.agency_id === '43') responseResult._43_simple_three_events_or_simple_one_validation_transaction_vkm_until_now += rideData.extension_scheduled; ;
			if (rideData.agency_id === '44') responseResult._44_simple_three_events_or_simple_one_validation_transaction_vkm_until_now += rideData.extension_scheduled; ;
		}

		//
	}

	//
	// Save items to the database

	const chacheableResource: CachedResource<typeof responseResult> = {
		data: responseResult,
		timestamp_resource: DateTime.now().setZone('Europe/Lisbon').toMillis(),
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.VKM, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.VKM} (${globalTimer.get()}).`);

	//
};
