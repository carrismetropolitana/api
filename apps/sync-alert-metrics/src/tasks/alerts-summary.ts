/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CachedResource } from '@carrismetropolitana/api-types/common';
import { type AlertsSummary } from '@carrismetropolitana/api-types/metrics';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { Dates } from '@tmlmobilidade/go-utils-dates';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { simplifiedApexValidations } from '@tmlmobilidade/interfaces';
import { AlertCause } from '@tmlmobilidade/types';

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
	const startOfYear = Dates
		.now('Europe/Lisbon')
		.startOf('year');

	const alertsCollection = await goDb.operation.alerts.getCollection();
	const filter = {
		active_period_start_date: {
			$gte: startOfYear.unix_timestamp,
			$lte: yesterdayDate.unix_timestamp,
		},
	};

	const totalAlerts = await alertsCollection.countDocuments(filter);
	LOGGER.info(`Processing ${totalAlerts} alerts from ${startOfYear.operational_date} to ${yesterdayDate.operational_date}`);
	const alertsStream = alertsCollection.find(filter).stream();

	//
	// Group alerts by cause

	let externalCausesCount = 0;
	const alertsByLineAndDate = new Map<string, AlertCause>();
	const dailyStats = new Map<string, { lines: Set<string>, passengers: number }>();
	const causeCountMap = new Map<string, number>();

	for await (const alert of alertsStream) {
		const cause = alert.cause as AlertCause;

		// Count by cause
		causeCountMap.set(cause, (causeCountMap.get(cause) ?? 0) + 1);

		// Check if external
		if (cause !== 'DRIVER_ABSENCE' && cause !== 'STRIKE' && cause !== 'TECHNICAL_ISSUE') {
			externalCausesCount++;
		}

		if (Array.isArray(alert.references)) {
			for (const ref of alert.references) {
				if (ref.parent_id && alert.active_period_start_date) {
					const date = Dates.fromUnixTimestamp(alert.active_period_start_date).operational_date;

					// Add to line-date map
					const key = `${date}-${ref.parent_id}`;
					alertsByLineAndDate.set(key, cause);

					// Add to daily stats
					if (!dailyStats.has(date)) {
						dailyStats.set(date, { lines: new Set(), passengers: 0 });
					}
					dailyStats.get(date).lines.add(ref.parent_id);
				}
			}
		}
	}

	//
	// Calculate affected_passengers by querying each day

	const externalCausesPercentage
        = totalAlerts > 0 ? Math.round((externalCausesCount / totalAlerts) * 100) : 0;

	let peopleAffected = 0;

	// Query validations day by day
	const sortedDailyStats = Array.from(dailyStats.keys()).sort();
	for (const date of sortedDailyStats) {
		const stats = dailyStats.get(date);
		const lines = Array.from(stats.lines);
		if (lines.length > 0) {
			const qty = await simplifiedApexValidations.count({
				created_at: {
					$gte: Dates.fromOperationalDate(date, 'Europe/Lisbon').startOf('day').unix_timestamp,
					$lt: Dates.fromOperationalDate(date, 'Europe/Lisbon').endOf('day').unix_timestamp,
				},
				is_passenger: true,
				line_id: { $in: lines },
			});
			stats.passengers = qty ?? 0;
			peopleAffected += stats.passengers;

			LOGGER.info(`${date}: ${lines.length} lines affected, ${stats.passengers} passengers affected`);
		}
	}

	LOGGER.info(`Total people affected: ${peopleAffected}`);

	//
	// Fetch service metrics (trips done vs not done)
	// Maybe will be used in the future with live data

	// const serviceRaw = await SERVERDB.get(SERVERDB_KEYS.METRICS.SERVICE);

	// const serviceString
	//     = typeof serviceRaw === 'string' ? serviceRaw : serviceRaw?.toString();
	// let serviceArray: any[] = [];

	// if (serviceString) {
	// 	const parsed = JSON.parse(serviceString);
	// 	serviceArray = Array.isArray(parsed.data) ? parsed.data : [];
	// }

	// const serviceMetrics = serviceArray.reduce((acc, metric) => {
	// 	const tripsNotMade = metric.total_trip_count - metric.pass_trip_count;

	// 	return {
	// 		totalTrips: acc.totalTrips + metric.total_trip_count,
	// 		totalTripsNotMade: acc.totalTripsNotMade + (tripsNotMade > 0 ? tripsNotMade : 0),
	// 		tripsByCause: tripsNotMade > 0 && alertsByLineAndDate.has(`${metric.operational_date}-${metric.line_id}`)
	// 			? {
	// 				...acc.tripsByCause,
	// 				[alertsByLineAndDate.get(`${metric.operational_date}-${metric.line_id}`)]:
	//                     (acc.tripsByCause[alertsByLineAndDate.get(`${metric.operational_date}-${metric.line_id}`)] ?? 0) + tripsNotMade,
	// 			}
	// 			: acc.tripsByCause,
	// 	};
	// }, { totalTrips: 0, totalTripsNotMade: 0, tripsByCause: {} as Record<string, number> });

	//
	// Build response object

	const response = {
		external_causes_percentage: externalCausesPercentage,
		people_affected: peopleAffected,
		total_alerts: totalAlerts,
		// total_trips: serviceMetrics.totalTrips,
		// trips_not_made: {
		// 	by_cause: Object.entries(serviceMetrics.tripsByCause).map(([cause, count]) => ({
		// 		cause: cause as Cause,
		// 		count: typeof count === 'number' ? count : 0,
		// 	})),
		// 	total: typeof serviceMetrics.totalTripsNotMade === 'number' ? serviceMetrics.totalTripsNotMade : 0,
		// },
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
