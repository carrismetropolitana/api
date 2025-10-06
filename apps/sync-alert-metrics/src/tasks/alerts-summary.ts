/* eslint-disable @typescript-eslint/no-explicit-any */

/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import { type AlertsSummary } from '@carrismetropolitana/api-types/metrics';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { alerts } from '@tmlmobilidade/interfaces';
import { Cause } from '@tmlmobilidade/types';
import { Dates } from '@tmlmobilidade/utils';

/* * */

export const alertsSummary = async () => {
	//

	LOGGER.init();
	const globalTimer = new TIMETRACKER();

	//
	// Fetch alerts from the last 15 days

	const yesterdayDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 1 });
	const fifteenDaysAgoDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 15 });

	const alertsCollection = await alerts.getCollection();
	const filter = {
		active_period_start_date: {
			$gte: fifteenDaysAgoDate.unix_timestamp,
			$lte: yesterdayDate.unix_timestamp,
		},
	};

	const totalAlerts = await alertsCollection.countDocuments(filter);
	const alertsStream = alertsCollection.find(filter).stream();

	//
	// Group alerts by cause

	let externalCausesCount = 0;
	const alertsByLineAndDate = new Map<string, Cause>();

	for await (const alert of alertsStream) {
		const cause = alert.cause as Cause;
		const isExternal
            = cause !== 'MAINTENANCE'
              && cause !== 'STRIKE'
              && cause !== 'TECHNICAL_PROBLEM';

		if (isExternal) externalCausesCount++;

		if (Array.isArray(alert.references)) {
			for (const ent of alert.references) {
				if (ent.parent_id && alert.active_period_start_date) {
					const key = `${Dates.fromUnixTimestamp(alert.active_period_start_date).operational_date}-${ent.parent_id}`;
					alertsByLineAndDate.set(key, cause);
				}
			}
		}
	}

	const externalCausesPercentage
        = totalAlerts > 0 ? Math.round((externalCausesCount / totalAlerts) * 100) : 0;

	//
	// Calculate affected_passengers from alerts evolution data (last 15 days)

	const evolutionRaw = await SERVERDB.get(SERVERDB_KEYS.METRICS.ALERTS.EVOLUTION);
	const evolutionString = typeof evolutionRaw === 'string' ? evolutionRaw : evolutionRaw?.toString();
	let evolutionArray: any[] = [];

	if (evolutionString) {
		const parsed = JSON.parse(evolutionString);
		evolutionArray = Array.isArray(parsed) ? parsed : Array.isArray(parsed.data) ? parsed.data : [];
	}

	const peopleAffected = evolutionArray.reduce(
		(sum: number, entry: { people_affected: number }) => sum + (entry.people_affected ?? 0),
		0,
	);

	//
	// Fetch service metrics (trips done vs not done)

	const serviceRaw = await SERVERDB.get(SERVERDB_KEYS.METRICS.SERVICE);

	const serviceString
        = typeof serviceRaw === 'string' ? serviceRaw : serviceRaw?.toString();
	let serviceArray: any[] = [];

	if (serviceString) {
		const parsed = JSON.parse(serviceString);
		serviceArray = Array.isArray(parsed.data) ? parsed.data : [];
	}

	let totalTrips = 0;
	let totalTripsNotMade = 0;
	const tripsByCause: Record<string, number> = {};

	for (const metric of serviceArray) {
		const { line_id, operational_date, pass_trip_count, total_trip_count }
            = metric;
		const tripsNotMade = total_trip_count - pass_trip_count;
		totalTrips += total_trip_count;

		if (tripsNotMade > 0) {
			totalTripsNotMade += tripsNotMade;

			const key = `${operational_date}-${line_id}`;

			const cause = alertsByLineAndDate.get(key);
			if (cause)
				tripsByCause[cause] = (tripsByCause[cause] ?? 0) + tripsNotMade;
		}
	}

	//
	// Build response object

	const response = {
		external_causes_percentage: externalCausesPercentage,
		people_affected: peopleAffected,
		total_alerts: totalAlerts,
		total_trips: totalTrips,
		trips_not_made: {
			by_cause: Object.entries(tripsByCause).map(([cause, count]) => ({
				cause: cause as Cause,
				count,
			})),
			total: totalTripsNotMade,
		},
	};

	//
	// Save items to the database
	const cacheableResource: CachedResource<AlertsSummary> = {
		data: response,
		timestamp_resource: Dates.now('Europe/Lisbon').unix_timestamp,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.ALERTS.SUMMARY, JSON.stringify(cacheableResource));

	LOGGER.success(`Done updating alerts summary to ${SERVERDB_KEYS.METRICS.ALERTS.SUMMARY} (${globalTimer.get()}).`);

	//
};
