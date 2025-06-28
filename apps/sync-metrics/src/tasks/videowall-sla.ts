/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { rides } from '@tmlmobilidade/interfaces';
import { ProcessingStatus, type Ride } from '@tmlmobilidade/types';
import { Dates } from '@tmlmobilidade/utils';

/* * */

export const videowallSla = async () => {
	//

	LOGGER.title(`Videowall - SLA`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup timestamp boundaries

	const operationalDate = Dates
		.now('Europe/Lisbon')
		.operational_date;

	const nowInUnixTimestamp = Dates.now('Europe/Lisbon').unix_timestamp;

	//
	// Setup the response JSON object

	const responseResult = {

		// For Area 1
		_41_scheduled_rides_total: 0,
		_41_scheduled_rides_until_now: 0,
		_41_simple_one_validation_transaction_fail_until_now: 0,
		_41_simple_three_events_fail_until_now: 0,
		_41_simple_three_events_or_simple_one_validation_transaction_fail_until_now: 0,

		// For Area 2
		_42_scheduled_rides_total: 0,
		_42_scheduled_rides_until_now: 0,
		_42_simple_one_validation_transaction_fail_until_now: 0,
		_42_simple_three_events_fail_until_now: 0,
		_42_simple_three_events_or_simple_one_validation_transaction_fail_until_now: 0,

		// For Area 3
		_43_scheduled_rides_total: 0,
		_43_scheduled_rides_until_now: 0,
		_43_simple_one_validation_transaction_fail_until_now: 0,
		_43_simple_three_events_fail_until_now: 0,
		_43_simple_three_events_or_simple_one_validation_transaction_fail_until_now: 0,

		// For Area 4
		_44_scheduled_rides_total: 0,
		_44_scheduled_rides_until_now: 0,
		_44_simple_one_validation_transaction_fail_until_now: 0,
		_44_simple_three_events_fail_until_now: 0,
		_44_simple_three_events_or_simple_one_validation_transaction_fail_until_now: 0,

		// For the whole CM
		_cm_scheduled_rides_total: 0,
		_cm_scheduled_rides_until_now: 0,
		_cm_simple_one_validation_transaction_fail_until_now: 0,
		_cm_simple_three_events_fail_until_now: 0,
		_cm_simple_three_events_or_simple_one_validation_transaction_fail_until_now: 0,

		//
	};

	//
	// Get all rides for today

	const ridesCollection = await rides.getCollection();
	const allRidesForTodayStream = ridesCollection.find({ operational_date: operationalDate }).stream();

	//
	// Iterate on all rides for today

	for await (const currentRide of allRidesForTodayStream) {
		//

		const rideData: Ride = currentRide as Ride;

		responseResult._cm_scheduled_rides_total++;
		if (rideData.agency_id === '41') responseResult._41_scheduled_rides_total++;
		if (rideData.agency_id === '42') responseResult._42_scheduled_rides_total++;
		if (rideData.agency_id === '43') responseResult._43_scheduled_rides_total++;
		if (rideData.agency_id === '44') responseResult._44_scheduled_rides_total++;

		//
		// Skip rides that are not yet processed

		if (rideData.system_status !== ProcessingStatus.Complete || !rideData.analysis) continue;

		//
		// Skip rides that should not have started yet (scheduled for the future)

		const rideShouldHaveStarted = nowInUnixTimestamp - rideData.start_time_scheduled < -300_000; // 5 minutes

		if (!rideShouldHaveStarted) continue;

		//
		// If a ride should have already started, but we still
		// do not have any data about it, we should count it as FAIL.

		responseResult._cm_scheduled_rides_until_now++;
		if (rideData.agency_id === '41') responseResult._41_scheduled_rides_until_now++;
		if (rideData.agency_id === '42') responseResult._42_scheduled_rides_until_now++;
		if (rideData.agency_id === '43') responseResult._43_scheduled_rides_until_now++;
		if (rideData.agency_id === '44') responseResult._44_scheduled_rides_until_now++;

		if (!rideData.seen_first_at) {
			responseResult._cm_simple_three_events_fail_until_now++;
			responseResult._cm_simple_one_validation_transaction_fail_until_now++;
			responseResult._cm_simple_three_events_or_simple_one_validation_transaction_fail_until_now++;
			if (rideData.agency_id === '41') {
				responseResult._41_simple_three_events_fail_until_now++;
				responseResult._41_simple_one_validation_transaction_fail_until_now++;
				responseResult._41_simple_three_events_or_simple_one_validation_transaction_fail_until_now++;
			}
			if (rideData.agency_id === '42') {
				responseResult._42_simple_three_events_fail_until_now++;
				responseResult._42_simple_one_validation_transaction_fail_until_now++;
				responseResult._42_simple_three_events_or_simple_one_validation_transaction_fail_until_now++;
			}
			if (rideData.agency_id === '43') {
				responseResult._43_simple_three_events_fail_until_now++;
				responseResult._43_simple_one_validation_transaction_fail_until_now++;
				responseResult._43_simple_three_events_or_simple_one_validation_transaction_fail_until_now++;
			}
			if (rideData.agency_id === '44') {
				responseResult._44_simple_three_events_fail_until_now++;
				responseResult._44_simple_one_validation_transaction_fail_until_now++;
				responseResult._44_simple_three_events_or_simple_one_validation_transaction_fail_until_now++;
			}
			continue;
		}

		//
		// If a ride should have already started and has already ended,
		// and failed the SIMPLE_THREE_VEHICLE_EVENTS test, then we should count it as FAIL.

		const rideHasAlreadyEnded = rideData.seen_last_at && nowInUnixTimestamp - rideData.seen_last_at < -120_000; // 2 minutes
		const simpleThreeVehicleEvents = rideData.analysis.SIMPLE_THREE_VEHICLE_EVENTS;
		const simpleOneValidationTransaction = rideData.analysis.SIMPLE_ONE_VALIDATION_TRANSACTION;

		// Skip if ride has not yet ended

		if (!rideHasAlreadyEnded) continue;

		if (simpleThreeVehicleEvents.grade !== 'pass') {
			responseResult._cm_simple_three_events_fail_until_now++;
			if (rideData.agency_id === '41') responseResult._41_simple_three_events_fail_until_now++;
			if (rideData.agency_id === '42') responseResult._42_simple_three_events_fail_until_now++;
			if (rideData.agency_id === '43') responseResult._43_simple_three_events_fail_until_now++;
			if (rideData.agency_id === '44') responseResult._44_simple_three_events_fail_until_now++;
		}

		if (simpleOneValidationTransaction.grade !== 'pass') {
			responseResult._cm_simple_one_validation_transaction_fail_until_now++;
			if (rideData.agency_id === '41') responseResult._41_simple_one_validation_transaction_fail_until_now++;
			if (rideData.agency_id === '42') responseResult._42_simple_one_validation_transaction_fail_until_now++;
			if (rideData.agency_id === '43') responseResult._43_simple_one_validation_transaction_fail_until_now++;
			if (rideData.agency_id === '44') responseResult._44_simple_one_validation_transaction_fail_until_now++;
		}

		if (simpleThreeVehicleEvents.grade !== 'pass' && simpleOneValidationTransaction.grade !== 'pass') {
			responseResult._cm_simple_three_events_or_simple_one_validation_transaction_fail_until_now++;
			if (rideData.agency_id === '41') responseResult._41_simple_three_events_or_simple_one_validation_transaction_fail_until_now++;
			if (rideData.agency_id === '42') responseResult._42_simple_three_events_or_simple_one_validation_transaction_fail_until_now++;
			if (rideData.agency_id === '43') responseResult._43_simple_three_events_or_simple_one_validation_transaction_fail_until_now++;
			if (rideData.agency_id === '44') responseResult._44_simple_three_events_or_simple_one_validation_transaction_fail_until_now++;
		}

		//
	}

	//
	// Save items to the database

	const chacheableResource: CachedResource<typeof responseResult> = {
		data: responseResult,
		timestamp_resource: Dates.now('Europe/Lisbon').unix_timestamp,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.SLA, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.SLA} (${globalTimer.get()}).`);

	//
};
