/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

interface VideowallEmptyRides {

	// For Area 1
	_41_empty_rides_count: number
	_41_empty_rides_vkm: number

	// For Area 2
	_42_empty_rides_count: number
	_42_empty_rides_vkm: number

	// For Area 3
	_43_empty_rides_count: number
	_43_empty_rides_vkm: number

	// For Area 4
	_44_empty_rides_count: number
	_44_empty_rides_vkm: number

	// For the whole CM
	_cm_empty_rides_count: number
	_cm_empty_rides_vkm: number

	//
};

export const videowallEmptyRides = async () => {
	//

	LOGGER.title(`Videowall - Empty Rides`);
	const globalTimer = new TIMETRACKER();

	//
	// Setup timestamp boundaries

	const operationalDate = Dates
		.now('Europe/Lisbon')
		// .minus({ days: 7 })
		.operational_date_int;

	const nowInUnixTimestamp = Dates
		.now('Europe/Lisbon')
		// .minus({ days: 7 })
		.unix_milliseconds - 120_000; // 2 minutes ago

	//
	// Query labdb for videowall empty rides
	// Empty = ended rides with zero (or null) apex validations

	const query = `
		WITH

			rides AS
			(
				SELECT
					r.agency_id,
					r.seen_last_at,
					r.apex_validations_qty,
					r.extension_scheduled
				FROM operation.rides AS r FINAL
				WHERE
					r.operational_date = ${operationalDate}
					AND r.agency_id IN ('A2L1N', 'BNA17', 'LA77N', 'YA15B')
			)

		SELECT
			/* Area 1 */
			countIf(
				agency_id = 'LA77N'
				AND seen_last_at IS NOT NULL
				AND seen_last_at <= ${nowInUnixTimestamp}
				AND (apex_validations_qty = 0 OR apex_validations_qty IS NULL)
			) AS _41_empty_rides_count,

			sumIf(
				extension_scheduled,
				agency_id = 'LA77N'
				AND seen_last_at IS NOT NULL
				AND seen_last_at <= ${nowInUnixTimestamp}
				AND (apex_validations_qty = 0 OR apex_validations_qty IS NULL)
			) AS _41_empty_rides_vkm,

			/* Area 2 */
			countIf(
				agency_id = 'BNA17'
				AND seen_last_at IS NOT NULL
				AND seen_last_at <= ${nowInUnixTimestamp}
				AND (apex_validations_qty = 0 OR apex_validations_qty IS NULL)
			) AS _42_empty_rides_count,

			sumIf(
				extension_scheduled,
				agency_id = 'BNA17'
				AND seen_last_at IS NOT NULL
				AND seen_last_at <= ${nowInUnixTimestamp}
				AND (apex_validations_qty = 0 OR apex_validations_qty IS NULL)
			) AS _42_empty_rides_vkm,

			/* Area 3 */
			countIf(
				agency_id = 'YA15B'
				AND seen_last_at IS NOT NULL
				AND seen_last_at <= ${nowInUnixTimestamp}
				AND (apex_validations_qty = 0 OR apex_validations_qty IS NULL)
			) AS _43_empty_rides_count,

			sumIf(
				extension_scheduled,
				agency_id = 'YA15B'
				AND seen_last_at IS NOT NULL
				AND seen_last_at <= ${nowInUnixTimestamp}
				AND (apex_validations_qty = 0 OR apex_validations_qty IS NULL)
			) AS _43_empty_rides_vkm,

			/* Area 4 */
			countIf(
				agency_id = 'A2L1N'
				AND seen_last_at IS NOT NULL
				AND seen_last_at <= ${nowInUnixTimestamp}
				AND (apex_validations_qty = 0 OR apex_validations_qty IS NULL)
			) AS _44_empty_rides_count,

			sumIf(
				extension_scheduled,
				agency_id = 'A2L1N'
				AND seen_last_at IS NOT NULL
				AND seen_last_at <= ${nowInUnixTimestamp}
				AND (apex_validations_qty = 0 OR apex_validations_qty IS NULL)
			) AS _44_empty_rides_vkm,

			/* Whole CM */
			countIf(
				seen_last_at IS NOT NULL
				AND seen_last_at <= ${nowInUnixTimestamp}
				AND (apex_validations_qty = 0 OR apex_validations_qty IS NULL)
			) AS _cm_empty_rides_count,

			sumIf(
				extension_scheduled,
				seen_last_at IS NOT NULL
				AND seen_last_at <= ${nowInUnixTimestamp}
				AND (apex_validations_qty = 0 OR apex_validations_qty IS NULL)
			) AS _cm_empty_rides_vkm

		FROM rides;
	`;

	const queryResult = await labDb.queryFromString<VideowallEmptyRides>(query);

	//
	// Save items to the database

	const chacheableResource: CachedResource<VideowallEmptyRides> = {
		data: queryResult[0],
		timestamp_resource: Dates.now('Europe/Lisbon').unix_milliseconds,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.VIDEOWALL.EMPTY_RIDES, JSON.stringify(chacheableResource));

	LOGGER.success(`Done updating items to ${SERVERDB_KEYS.METRICS.VIDEOWALL.EMPTY_RIDES} (${globalTimer.get()}).`);

	//
};
