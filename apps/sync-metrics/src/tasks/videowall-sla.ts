/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

interface VideowallSla {

	// For Area 1
	_41_scheduled_rides_total: number
	_41_scheduled_rides_until_now: number
	_41_simple_one_validation_transaction_fail_until_now: number
	_41_simple_three_events_fail_until_now: number
	_41_simple_three_events_or_simple_one_validation_transaction_fail_until_now: number

	// For Area 2
	_42_scheduled_rides_total: number
	_42_scheduled_rides_until_now: number
	_42_simple_one_validation_transaction_fail_until_now: number
	_42_simple_three_events_fail_until_now: number
	_42_simple_three_events_or_simple_one_validation_transaction_fail_until_now: number

	// For Area 3
	_43_scheduled_rides_total: number
	_43_scheduled_rides_until_now: number
	_43_simple_one_validation_transaction_fail_until_now: number
	_43_simple_three_events_fail_until_now: number
	_43_simple_three_events_or_simple_one_validation_transaction_fail_until_now: number

	// For Area 4
	_44_scheduled_rides_total: number
	_44_scheduled_rides_until_now: number
	_44_simple_one_validation_transaction_fail_until_now: number
	_44_simple_three_events_fail_until_now: number
	_44_simple_three_events_or_simple_one_validation_transaction_fail_until_now: number

	// For the whole CM
	_cm_scheduled_rides_total: number
	_cm_scheduled_rides_until_now: number
	_cm_simple_one_validation_transaction_fail_until_now: number
	_cm_simple_three_events_fail_until_now: number
	_cm_simple_three_events_or_simple_one_validation_transaction_fail_until_now: number

	//
};

export const videowallSla = async () => {
	//

	LOGGER.title(`Videowall - SLA`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup timestamp boundaries

	const operationalDate = Dates
		.now('Europe/Lisbon')
		.operational_date_int;

	const nowInUnixTimestamp = Dates
		.now('Europe/Lisbon')
		.unix_milliseconds - 300_000; // 5 minutes ago

	//
	// Query labdb for videowall SLA

	const query = `
		WITH

			rides AS
			(
				SELECT
					r._id,
					r.agency_id,
					r.start_time_scheduled,
					r.seen_first_at,
					r.seen_last_at,
					a1.grade_status AS simple_one_grade,
					a3.grade_status AS simple_three_grade
				FROM operation.rides AS r FINAL

				LEFT JOIN
				(
					SELECT
						ride_id,
						argMax(grade_status, updated_at) AS grade_status
					FROM operation.ride_analysis_simple_one_apex_validation
					WHERE operational_date = ${operationalDate}
					GROUP BY ride_id
				) AS a1
					ON a1.ride_id = r._id

				LEFT JOIN
				(
					SELECT
						ride_id,
						argMax(grade_status, updated_at) AS grade_status
					FROM operation.ride_analysis_simple_three_vehicle_events
					GROUP BY ride_id
				) AS a3
					ON a3.ride_id = r._id

				WHERE
					r.operational_date = ${operationalDate}
					AND r.agency_id IN ('A2L1N', 'BNA17', 'LA77N', 'YA15B')
					AND r.processing_status = 'complete'
					AND a1.grade_status IS NOT NULL
					AND a3.grade_status IS NOT NULL
			)

		SELECT
			/* Area 1 */
			countIf(agency_id = 'LA77N') AS _41_scheduled_rides_total,

			countIf(
				agency_id = 'LA77N'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
			) AS _41_scheduled_rides_until_now,

			countIf(
				agency_id = 'LA77N'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_one_grade != 'pass'
					)
				)
			) AS _41_simple_one_validation_transaction_fail_until_now,

			countIf(
				agency_id = 'LA77N'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_three_grade != 'pass'
					)
				)
			) AS _41_simple_three_events_fail_until_now,

			countIf(
				agency_id = 'LA77N'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_three_grade != 'pass'
						AND simple_one_grade != 'pass'
					)
				)
			) AS _41_simple_three_events_or_simple_one_validation_transaction_fail_until_now,

			/* Area 2 */
			countIf(agency_id = 'BNA17') AS _42_scheduled_rides_total,

			countIf(
				agency_id = 'BNA17'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
			) AS _42_scheduled_rides_until_now,

			countIf(
				agency_id = 'BNA17'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_one_grade != 'pass'
					)
				)
			) AS _42_simple_one_validation_transaction_fail_until_now,

			countIf(
				agency_id = 'BNA17'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_three_grade != 'pass'
					)
				)
			) AS _42_simple_three_events_fail_until_now,

			countIf(
				agency_id = 'BNA17'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_three_grade != 'pass'
						AND simple_one_grade != 'pass'
					)
				)
			) AS _42_simple_three_events_or_simple_one_validation_transaction_fail_until_now,

			/* Area 3 */
			countIf(agency_id = 'YA15B') AS _43_scheduled_rides_total,

			countIf(
				agency_id = 'YA15B'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
			) AS _43_scheduled_rides_until_now,

			countIf(
				agency_id = 'YA15B'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_one_grade != 'pass'
					)
				)
			) AS _43_simple_one_validation_transaction_fail_until_now,

			countIf(
				agency_id = 'YA15B'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_three_grade != 'pass'
					)
				)
			) AS _43_simple_three_events_fail_until_now,

			countIf(
				agency_id = 'YA15B'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_three_grade != 'pass'
						AND simple_one_grade != 'pass'
					)
				)
			) AS _43_simple_three_events_or_simple_one_validation_transaction_fail_until_now,

			/* Area 4 */
			countIf(agency_id = 'A2L1N') AS _44_scheduled_rides_total,

			countIf(
				agency_id = 'A2L1N'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
			) AS _44_scheduled_rides_until_now,

			countIf(
				agency_id = 'A2L1N'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_one_grade != 'pass'
					)
				)
			) AS _44_simple_one_validation_transaction_fail_until_now,

			countIf(
				agency_id = 'A2L1N'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_three_grade != 'pass'
					)
				)
			) AS _44_simple_three_events_fail_until_now,

			countIf(
				agency_id = 'A2L1N'
				AND start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_three_grade != 'pass'
						AND simple_one_grade != 'pass'
					)
				)
			) AS _44_simple_three_events_or_simple_one_validation_transaction_fail_until_now,

			/* Whole CM */
			count() AS _cm_scheduled_rides_total,

			countIf(
				start_time_scheduled <= ${nowInUnixTimestamp}
			) AS _cm_scheduled_rides_until_now,

			countIf(
				start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_one_grade != 'pass'
					)
				)
			) AS _cm_simple_one_validation_transaction_fail_until_now,

			countIf(
				start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_three_grade != 'pass'
					)
				)
			) AS _cm_simple_three_events_fail_until_now,

			countIf(
				start_time_scheduled <= ${nowInUnixTimestamp}
				AND (
					seen_first_at IS NULL
					OR (
						seen_last_at IS NOT NULL
						AND seen_last_at <= ${nowInUnixTimestamp - 120000}
						AND simple_three_grade != 'pass'
						AND simple_one_grade != 'pass'
					)
				)
			) AS _cm_simple_three_events_or_simple_one_validation_transaction_fail_until_now

		FROM rides;
	`;

	console.log(query);

	const queryResult = await labDb.queryFromString<VideowallSla>(query);

	//
	// Save items to the database

	const chacheableResource: CachedResource<VideowallSla> = {
		data: queryResult[0],
		timestamp_resource: Dates.now('Europe/Lisbon').unix_milliseconds,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.SLA, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.SLA} (${globalTimer.get()}).`);

	//
};
