/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

interface VideowallDelays {

	// For Area 1
	_41_average_delay_minutes: number
	_41_delayed_for_more_than_five_minutes_count: number
	_41_total_until_now_count: number

	// For Area 2
	_42_average_delay_minutes: number
	_42_delayed_for_more_than_five_minutes_count: number
	_42_total_until_now_count: number

	// For Area 3
	_43_average_delay_minutes: number
	_43_delayed_for_more_than_five_minutes_count: number
	_43_total_until_now_count: number

	// For Area 4
	_44_average_delay_minutes: number
	_44_delayed_for_more_than_five_minutes_count: number
	_44_total_until_now_count: number

	// For the whole CM
	_cm_average_delay_minutes: number
	_cm_delayed_for_more_than_five_minutes_count: number
	_cm_total_until_now_count: number

	//
};

export const videowallDelays = async () => {
	//

	LOGGER.title(`Videowall - Delays`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup timestamp boundaries

	const operationalDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 7 })
		.operational_date_int;

	//
	// Query labdb for videowall delays
	// Only consider rides that have already started (start_time_observed IS NOT NULL)
	// and that have expected-start-time analysis.

	const query = `
		WITH

			rides AS
			(
				SELECT
					r._id,
					r.agency_id,
					a.reason AS reason,
					a.observed_start_time_delta AS delay_minutes
				FROM operation.rides AS r FINAL

				INNER JOIN
				(
					SELECT
						ride_id,
						argMax(reason, updated_at) AS reason,
						argMax(observed_start_time_delta, updated_at) AS observed_start_time_delta
					FROM operation.ride_analysis_expected_start_time
					WHERE operational_date = ${operationalDate}
					GROUP BY ride_id
				) AS a
					ON a.ride_id = r._id

				WHERE
					r.operational_date = ${operationalDate}
					AND r.agency_id IN ('A2L1N', 'BNA17', 'LA77N', 'YA15B')
					AND r.start_time_observed IS NOT NULL
			)

		SELECT
			/* Area 1 */
			ifNotFinite(avgIf(delay_minutes, agency_id = 'LA77N' AND delay_minutes >= 0), 0) AS _41_average_delay_minutes,
			countIf(agency_id = 'LA77N' AND reason = 'LATE_START') AS _41_delayed_for_more_than_five_minutes_count,
			countIf(agency_id = 'LA77N' AND delay_minutes >= 0) AS _41_total_until_now_count,

			/* Area 2 */
			ifNotFinite(avgIf(delay_minutes, agency_id = 'BNA17' AND delay_minutes >= 0), 0) AS _42_average_delay_minutes,
			countIf(agency_id = 'BNA17' AND reason = 'LATE_START') AS _42_delayed_for_more_than_five_minutes_count,
			countIf(agency_id = 'BNA17' AND delay_minutes >= 0) AS _42_total_until_now_count,

			/* Area 3 */
			ifNotFinite(avgIf(delay_minutes, agency_id = 'YA15B' AND delay_minutes >= 0), 0) AS _43_average_delay_minutes,
			countIf(agency_id = 'YA15B' AND reason = 'LATE_START') AS _43_delayed_for_more_than_five_minutes_count,
			countIf(agency_id = 'YA15B' AND delay_minutes >= 0) AS _43_total_until_now_count,

			/* Area 4 */
			ifNotFinite(avgIf(delay_minutes, agency_id = 'A2L1N' AND delay_minutes >= 0), 0) AS _44_average_delay_minutes,
			countIf(agency_id = 'A2L1N' AND reason = 'LATE_START') AS _44_delayed_for_more_than_five_minutes_count,
			countIf(agency_id = 'A2L1N' AND delay_minutes >= 0) AS _44_total_until_now_count,

			/* Whole CM */
			ifNotFinite(avgIf(delay_minutes, delay_minutes >= 0), 0) AS _cm_average_delay_minutes,
			countIf(reason = 'LATE_START') AS _cm_delayed_for_more_than_five_minutes_count,
			countIf(delay_minutes >= 0) AS _cm_total_until_now_count

		FROM rides;
	`;

	const queryResult = await labDb.queryFromString<VideowallDelays>(query);

	//
	// Save items to the database

	const chacheableResource: CachedResource<VideowallDelays> = {
		data: queryResult[0],
		timestamp_resource: Dates.now('Europe/Lisbon').unix_milliseconds,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.DELAYS, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.DELAYS} (${globalTimer.get()}).`);

	//
};
