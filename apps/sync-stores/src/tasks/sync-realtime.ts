/* * */

import { IXAPI, SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { CurrentStoreStatus, Store } from '@carrismetropolitana/api-types/src/api/facilities.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';

/* * */

const BUSY_RATIO = 0.1;

const TIME_BY_CATEGORY = {
	A: { avg_seconds_per_ticket: 300, category_code: 'A', category_name: 'Cartões' },
	B: { avg_seconds_per_ticket: 180, category_code: 'B', category_name: 'Carregamentos' },
	C: { avg_seconds_per_ticket: 180, category_code: 'C', category_name: 'Perdidos e Achados' },
	D: { avg_seconds_per_ticket: 200, category_code: 'D', category_name: 'Prioritário' },
	default: { avg_seconds_per_ticket: 200, category_code: 'N/A', category_name: 'Unknown' },
};

/* * */

export const syncRealtime = async () => {
	//

	LOGGER.title('Sync Stores Realtime');
	const globalTimer = new TIMETRACKER();

	//
	// Retrieve existing ENCM documents from database

	const allStoresTxt = await SERVERDB.get(SERVERDB_KEYS.FACILITIES.STORES);
	const allStoresData: Store[] = JSON.parse(allStoresTxt);

	// 2.
	// Query IXAPI for all waiting tickets and open counters

	const currentDateString = DateTime.now().setZone('UTC').toFormat('yyyy-MM-dd HH:mm:ss');
	const twoHoursAgoDateString = DateTime.now().setZone('UTC').minus({ hour: 2 }).toFormat('yyyy-MM-dd HH:mm:ss');

	const allTicketsWaiting = await IXAPI.request({ finalDate: currentDateString, initialDate: twoHoursAgoDateString, reportType: 'ticket', status: 'W' });
	const allCounters = await IXAPI.request({ finalDate: currentDateString, initialDate: twoHoursAgoDateString, reportType: 'siteReportByCounter' });

	//
	// Add realtime status to each ENCM

	const updatedStoresData: Store[] = [];

	for (const foundDocument of allStoresData) {
		//

		//
		// Filter all waiting tickets by the current ENCM id

		const ticketsWaiting = allTicketsWaiting?.content?.ticket?.filter(item => item.siteEID === foundDocument.id);

		//
		// Filter active counters for the current ENCM id, and deduplicate them

		const activeCounters = allCounters?.content?.siteReport?.filter((item) => {
			const siteEidMatchesEncmId = item.siteEID === foundDocument.id;
			const counterStatusMatches = item.counterStatus === 'A' || item.counterStatus === 'P' || item.counterStatus === 'O' || item.counterStatus === 'S';
			return siteEidMatchesEncmId && counterStatusMatches;
		});

		const activeCountersUnique = Array.from(new Set(activeCounters?.map(obj => obj.counterSID))).map(counterSID => activeCounters.find(obj => obj.counterSID === counterSID));

		//
		// Calculate the average wait time for the total tickets by category

		let totalWaitTime = 0;

		ticketsWaiting?.forEach((ticket) => {
			if (TIME_BY_CATEGORY[ticket.categoryCode]) {
				totalWaitTime += TIME_BY_CATEGORY[ticket.categoryCode].avg_seconds_per_ticket / (activeCountersUnique.length || 1);
			}
			else {
				totalWaitTime += TIME_BY_CATEGORY.default.avg_seconds_per_ticket / (activeCountersUnique.length || 1);
			}
		});

		//
		// Calculate the store current status

		let currentStatus: CurrentStoreStatus;

		const activeCountersToPeopleWaitingRatio = activeCountersUnique.length / (ticketsWaiting?.length || 1);

		if (activeCountersUnique.length > 0 && activeCountersToPeopleWaitingRatio > BUSY_RATIO) {
			currentStatus = CurrentStoreStatus.open;
		}
		else if (activeCountersUnique.length > 0) {
			currentStatus = CurrentStoreStatus.busy;
		}
		else {
			currentStatus = CurrentStoreStatus.closed;
		}

		//
		// Format the update query with the request results

		const updatedDocument: Store = {
			...foundDocument,
			active_counters: activeCountersUnique.length,
			current_ratio: activeCountersToPeopleWaitingRatio,
			current_status: currentStatus,
			currently_waiting: ticketsWaiting?.length || 0,
			estimated_wait_seconds: totalWaitTime || 0,
			is_open: activeCountersUnique.length > 0 ? true : false,
		};

		//
		// Update the current document with the new values

		updatedStoresData.push(updatedDocument);

		LOGGER.info(`id: ${foundDocument.id} | current_status: ${updatedDocument.current_status} | active_counters: ${updatedDocument.active_counters} | currently_waiting: ${updatedDocument.currently_waiting} | estimated_wait_seconds: ${updatedDocument.estimated_wait_seconds} | short_name: ${foundDocument.short_name}`);

		//
	}

	//
	// Save all documents

	const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
	allStoresData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.set(SERVERDB_KEYS.FACILITIES.STORES, JSON.stringify(allStoresData));

	LOGGER.success(`Updated ${allStoresData.length} Stores (${globalTimer.get()})`);

	//
};
