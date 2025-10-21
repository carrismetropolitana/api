import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { metrics } from '@tmlmobilidade/interfaces';
import { Metric } from '@tmlmobilidade/types';

/* * */

export const demandMetrics = async () => {
	//

	LOGGER.title(`Sync Demand Metrics`);

	const globalTimer = new TIMETRACKER();

	//
	// Define metrics

	const metricsToSync = [
		{ metric: 'demand_by_agency_by_day', serverDbKey: SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.DAY },
		{ metric: 'demand_by_agency_by_month', serverDbKey: SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.MONTH },
		{ metric: 'demand_by_line_by_day', serverDbKey: SERVERDB_KEYS.METRICS.DEMAND.BY_LINE },
		{ metric: 'top_demand_by_agency', serverDbKey: SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.RECORDS },
	];

	//
	// Get metrics collection

	const metricsCollection = await metrics.getCollection();

	//
	// Fetch all metrics and save to SERVERDB

	for (const { metric, serverDbKey } of metricsToSync) {
		const metricDocs = await metricsCollection
			.find({ metric })
			.toArray() as Metric[];

		if (!metricDocs.length) {
			LOGGER.error(`No documents found for metric "${metric}".`);
			continue;
		}
		// Save to SERVERDB
		await SERVERDB.set(serverDbKey, JSON.stringify(metricDocs));
	}

	LOGGER.terminate(`Sync Demand Metrics complete (${globalTimer.get()})`);
};
