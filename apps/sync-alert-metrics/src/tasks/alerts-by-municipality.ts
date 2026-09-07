/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type CachedResource } from '@carrismetropolitana/api-types/common';
import { AlertsByMunicipality } from '@carrismetropolitana/api-types/metrics';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { HubV1ApiAlert } from '@tmlmobilidade/go-types-hub';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

export const alertsByMunicipality = async () => {
	//

	LOGGER.title(`Sync alerts By Municipality`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch alerts from start of the year

	const yesterdayDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 1 });

	const startOfYear = Dates
		.now('Europe/Lisbon')
		.startOf('year');

	const alertsCollection = await goDb.operation.alerts.getCollection();
	const filter = { active_period_start_date: { $gte: startOfYear.unix_milliseconds, $lte: yesterdayDate.unix_milliseconds } };
	const alertsStream = alertsCollection.find(filter).stream();

	//
	// Group alerts by municipality and cause

	const municipalityMap = new Map<string, Map<HubV1ApiAlert['cause'], number>>();

	for await (const alert of alertsStream) {
		const cause = alert.cause;

		const municipalityIds = Array.isArray(alert.municipality_ids) ? alert.municipality_ids : [];

		for (const municipalityId of municipalityIds) {
			if (!municipalityMap.has(municipalityId)) {
				municipalityMap.set(municipalityId, new Map<HubV1ApiAlert['cause'], number>());
			}

			const causeMap = municipalityMap.get(municipalityId);
			causeMap.set(cause, (causeMap.get(cause) ?? 0) + 1);
		}
	}

	//
	// Build response array by returning top 5 municipalities by total alerts

	const response = Array.from(municipalityMap.entries()).map(([municipality_id, causeMap]) => {
		const total = Array.from(causeMap.values()).reduce((sum, value) => sum + value, 0);
		return {
			causes: Array.from(causeMap.entries()).map(([type, value]) => ({ type: type as HubV1ApiAlert['cause'], value: value })) as { type: HubV1ApiAlert['cause'], value: number }[],
			municipality_id,
			total,
		} as AlertsByMunicipality;
	})
		.sort((a, b) => b.total - a.total)
		.slice(0, 5);

	//
	// Save to database

	const cacheableResource: CachedResource<typeof response> = {
		data: response,
		timestamp_resource: Dates.now('Europe/Lisbon').unix_milliseconds,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.ALERTS.BY_MUNICIPALITY, JSON.stringify(cacheableResource));

	LOGGER.success(`Done updating ${cacheableResource.data.length} items to ${SERVERDB_KEYS.METRICS.ALERTS.BY_MUNICIPALITY} (${globalTimer.get()}).`);

	//
};
