/* * */

import { NETWORKDB } from '@carrismetropolitana/api-services/NETWORKDB';
import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type Plan } from '@carrismetropolitana/api-types/network';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';

/* * */

export const syncPlans = async () => {
	//

	LOGGER.title(`Sync Plans`);
	const globalTimer = new TIMETRACKER();

	//
	// Fetch all Plans from NETWORKDB

	const allPlans = await NETWORKDB.client.query('SELECT * FROM plans');

	//
	// For each item, update its entry in the database

	const allPlansData: Plan[] = [];
	let updatedPlansCounter = 0;

	for (const plan of allPlans.rows) {
		//
		const parsedPlan: Plan = {
			agency_id: plan.operator_id,
			id: plan.plan_id,
			valid_range: {
				end: plan.plan_end_date,
				start: plan.plan_start_date,
			},
		};
		//
		allPlansData.push(parsedPlan);
		//
		updatedPlansCounter++;
		//
	}

	//
	// Save to the database

	allPlansData.sort((a, b) => sortCollator.compare(a.valid_range.start, b.valid_range.start));
	await SERVERDB.set(SERVERDB_KEYS.NETWORK.PLANS, JSON.stringify(allPlansData));

	LOGGER.success(`Done updating ${updatedPlansCounter} Plans (${globalTimer.get()})`);

	//
};
