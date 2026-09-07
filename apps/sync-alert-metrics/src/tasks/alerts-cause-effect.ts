/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type CachedResource } from '@carrismetropolitana/api-types/common';
import { type AlertsCauseEffect } from '@carrismetropolitana/api-types/metrics';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { goDb } from '@tmlmobilidade/go-interfaces-godb';
import { HubV1ApiAlert } from '@tmlmobilidade/go-types-hub';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

export const alertsCauseEffect = async () => {
	//

	LOGGER.title(`Sync alerts by cause-effect`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch alerts from from 15 days ago

	const yesterdayDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 1 });

	const fifteenDaysAgoDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 15 });

	const alertsCollection = await goDb.operation.alerts.getCollection();
	const filter = { active_period_start_date: { $gte: fifteenDaysAgoDate.unix_milliseconds, $lte: yesterdayDate.unix_milliseconds } };
	const alertsStream = alertsCollection.find(filter).stream();

	//
	// Group by cause and effect

	const causeEffectMap = new Map<HubV1ApiAlert['cause'], { effectMap: Map<HubV1ApiAlert['effect'], number>, total: number }>();

	for await (const alert of alertsStream) {
		const cause = alert.cause;
		const effect = alert.effect;
		if (!causeEffectMap.has(cause)) {
			causeEffectMap.set(cause, { effectMap: new Map<HubV1ApiAlert['effect'], number>(), total: 0 });
		}

		const group = causeEffectMap.get(cause);
		group.total += 1;
		group.effectMap.set(effect, (group.effectMap.get(effect) ?? 0) + 1);
	}

	//
	// Build response array
	const response = Array.from(causeEffectMap.entries()).map(([cause, { effectMap, total }]) => ({
		cause,
		effects: Array.from(effectMap.entries()).map(([type, value]) => ({ type, value })),
		total,
	}));

	//
	// Save to database
	const cacheableResource: CachedResource<AlertsCauseEffect[]> = {
		data: response,
		timestamp_resource: Dates.now('Europe/Lisbon').unix_milliseconds,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.ALERTS.CAUSE_EFFECT, JSON.stringify(cacheableResource));

	LOGGER.success(`Done updating ${cacheableResource.data.length} items to ${SERVERDB_KEYS.METRICS.ALERTS.CAUSE_EFFECT} (${globalTimer.get()}).`);

	//
};
