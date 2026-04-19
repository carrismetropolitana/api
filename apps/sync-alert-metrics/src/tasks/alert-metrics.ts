/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type CachedResource } from '@carrismetropolitana/api-types/common';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { Dates } from '@tmlmobilidade/dates';
import { alerts } from '@tmlmobilidade/interfaces';
import { Alert, AlertCause, AlertEffect } from '@tmlmobilidade/types';

/* * */

export const alertMetrics = async () => {
	//

	LOGGER.title(`Sync global alert mertrics`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch alerts from the start of the year

	const yesterdayDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 1 });

	const startOfYear = Dates.now('Europe/Lisbon').startOf('year');

	const alertsCollection = await alerts.getCollection();
	const filter = { active_period_start_date: { $gte: startOfYear.unix_timestamp, $lte: yesterdayDate.unix_timestamp } };
	const totalAlerts = await alertsCollection.countDocuments(filter);
	const alertsStream = alertsCollection.find(filter).stream();

	//
	// Metrics maps

	const causeCountMap = new Map<string, number>();
	const effectCountMap = new Map<string, number>();
	const municipalityCountMap = new Map<string, number>();
	const monthlyCountMap = new Map<string, number>();

	for await (const alert of alertsStream) {
		const alertData = alert as Alert;

		// Cause
		const cause = alertData.cause as AlertCause || 'UNKNOWN_CAUSE';
		causeCountMap.set(cause, (causeCountMap.get(cause) ?? 0) + 1);

		// Effect
		const effect = alertData.effect as AlertEffect || 'UNKNOWN_EFFECT';
		effectCountMap.set(effect, (effectCountMap.get(effect) ?? 0) + 1);

		// Municipality
		if (Array.isArray(alertData.municipality_ids)) {
			for (const municipality of alertData.municipality_ids) {
				municipalityCountMap.set(municipality, (municipalityCountMap.get(municipality) ?? 0) + 1);
			}
		}

		// Monthly count
		const date = new Date(alertData.active_period_start_date);
		const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		monthlyCountMap.set(monthKey, (monthlyCountMap.get(monthKey) ?? 0) + 1);
	}

	// Build response object
	const response = {
		alerts_by_cause: Array.from(causeCountMap.entries()).map(([cause, count]) => ({ cause, count })),
		alerts_by_effect: Array.from(effectCountMap.entries()).map(([effect, count]) => ({ count, effect })),
		alerts_by_municipality: Array.from(municipalityCountMap.entries()).map(([municipality, count]) => ({ count, municipality })),
		alerts_over_time: Array.from(monthlyCountMap.entries()).map(([month, count]) => ({ count, month })),
		total_alerts: totalAlerts,
	};

	//
	// Save items to the database

	const cacheableResource: CachedResource<typeof response> = {
		data: response,
		timestamp_resource: Dates.now('Europe/Lisbon').unix_timestamp,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.ALERTS.ALL, JSON.stringify(cacheableResource));

	LOGGER.success(`Done updating alert metrics to ${SERVERDB_KEYS.METRICS.ALERTS.ALL} (${globalTimer.get()}).`);

	//
};
