/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type CachedResource } from '@carrismetropolitana/api-types/common';
import { type AlertsEvolution } from '@carrismetropolitana/api-types/metrics';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { alerts, simplifiedApexValidations } from '@tmlmobilidade/interfaces';
import { Dates } from '@tmlmobilidade/dates';

/* * */

export const alertsEvolution = async () => {
	//

	LOGGER.title(`Sync alerts evolution`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch alerts from 15 days ago

	const yesterdayDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 1 });

	const fifteenDaysAgoDate = Dates
		.now('Europe/Lisbon')
		.minus({ days: 15 });

	const alertsCollection = await alerts.getCollection();
	const alertsStream = alertsCollection.find({ active_period_start_date: { $gte: fifteenDaysAgoDate.unix_timestamp, $lte: yesterdayDate.unix_timestamp } }).stream();

	//
	// Group alerts by day and collect unique line IDs

	const dayMap = new Map<string, { lines_affected: Set<string>, people_affected: number, total_alerts: number }>();

	for await (const alert of alertsStream) {
		const date = new Date(alert.active_period_start_date);
		const day_group = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

		//
		// Extract line IDs from alert.references
		const affectedLines = Array.isArray(alert.references)
			? alert.references.map(ref => ref.parent_id).filter(Boolean)
			: [];

		if (!dayMap.has(day_group)) {
			dayMap.set(day_group, { lines_affected: new Set(), people_affected: 0, total_alerts: 0 });
		}

		const group = dayMap.get(day_group);
		for (const lineId of affectedLines) {
			group.lines_affected.add(lineId);
		}

		group.total_alerts++;
	}

	//
	// For each day, query validations in bulk for all unique lines

	for (const [day_group, group] of dayMap.entries()) {
		const lines = Array.from(group.lines_affected);
		if (lines.length === 0) {
			continue;
		}

		const startOfDayTimestamp = Dates.fromISO(day_group).startOf('day').unix_timestamp;
		const endOfDayTimestamp = Dates.fromISO(day_group).endOf('day').unix_timestamp;

		const qty = await simplifiedApexValidations.count({
			created_at: { $gte: startOfDayTimestamp, $lt: endOfDayTimestamp },
			is_passenger: true,
			line_id: { $in: lines },
		});

		group.people_affected = qty ?? 0;
	}

	//
	// Build response array

	const response = Array.from(dayMap.entries())
		.map(([day_group, { lines_affected, people_affected, total_alerts }]) => ({
			day_group,
			lines_affected: lines_affected.size,
			people_affected,
			total_alerts,
		}))
		.sort((a, b) => a.day_group.localeCompare(b.day_group)) as AlertsEvolution[];

	const cacheableResource: CachedResource<typeof response> = {
		data: response,
		timestamp_resource: Dates.now('Europe/Lisbon').unix_timestamp,
	};

	await SERVERDB.set(SERVERDB_KEYS.METRICS.ALERTS.EVOLUTION, JSON.stringify(cacheableResource));

	LOGGER.success(`Done updating ${cacheableResource.data.length} items to ${SERVERDB_KEYS.METRICS.ALERTS.EVOLUTION} (${globalTimer.get()}).`);

	//
};
