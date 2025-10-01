/* eslint-disable @typescript-eslint/no-explicit-any */

/* * */

import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { Dates } from '@tmlmobilidade/utils';
import { alerts } from '@tmlmobilidade/interfaces';
import { Alert, Cause, Effect } from '@tmlmobilidade/types';
import { type CachedResource } from '@carrismetropolitana/api-types/common';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

export const alertMetrics = async () => {
    //

    LOGGER.init();
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
        const cause = alertData.cause as Cause || 'UNKNOWN_CAUSE';
        causeCountMap.set(cause, (causeCountMap.get(cause) ?? 0) + 1);

        // Effect
        const effect = alertData.effect as Effect || 'UNKNOWN_EFFECT';
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
        total_alerts: totalAlerts,
        alerts_by_cause: Array.from(causeCountMap.entries()).map(([cause, count]) => ({ cause, count })),
        alerts_by_effect: Array.from(effectCountMap.entries()).map(([effect, count]) => ({ effect, count })),
        alerts_by_municipality: Array.from(municipalityCountMap.entries()).map(([municipality, count]) => ({ municipality, count })),
        alerts_over_time: Array.from(monthlyCountMap.entries()).map(([month, count]) => ({ month, count })),
    };

    LOGGER.info(`Alert Metrics: ${JSON.stringify(response)}`);

	//
	// Save items to the database

	const cacheableResource: CachedResource<typeof response> = {
        data: response,
        timestamp_resource: Dates.now('Europe/Lisbon').unix_timestamp,
    };

    await SERVERDB.set(SERVERDB_KEYS.METRICS.ALERTS, JSON.stringify(cacheableResource));

    //

    LOGGER.terminate(`Done with this iteration (${globalTimer.get()})`);

    //
};
