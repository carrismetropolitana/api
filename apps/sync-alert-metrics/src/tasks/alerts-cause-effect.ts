/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type CachedResource } from '@carrismetropolitana/api-types/common';
import { type AlertsCauseEffect } from '@carrismetropolitana/api-types/metrics';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { Dates } from '@tmlmobilidade/dates';
import { alerts } from '@tmlmobilidade/interfaces';
import { GtfsCause, GtfsEffect } from '@tmlmobilidade/types';

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

	const alertsCollection = await alerts.getCollection();
	const filter = { active_period_start_date: { $gte: fifteenDaysAgoDate.unix_timestamp, $lte: yesterdayDate.unix_timestamp } };
	const alertsStream = alertsCollection.find(filter).stream();

	//
	// Group by cause and effect

	const causeEffectMap = new Map<GtfsCause, { effectMap: Map<GtfsEffect, number>, total: number }>();

	for await (const alert of alertsStream) {
		const cause = alert.cause as GtfsCause;
		const effect = alert.effect as GtfsEffect;
		if (!causeEffectMap.has(cause)) {
			causeEffectMap.set(cause, { effectMap: new Map<GtfsEffect, number>(), total: 0 });
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
		timestamp_resource: Dates.now('Europe/Lisbon').unix_timestamp,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.ALERTS.CAUSE_EFFECT, JSON.stringify(cacheableResource));

	LOGGER.success(`Done updating ${cacheableResource.data.length} items to ${SERVERDB_KEYS.METRICS.ALERTS.CAUSE_EFFECT} (${globalTimer.get()}).`);

	//
};
