//
import IXAPI from '@/services/IXAPI.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { DateTime } from 'luxon';

/* * */

const ENCM_TIME_BY_CATEGORY = {
	A: { avg_seconds_per_ticket: 300, category_code: 'A', category_name: 'Cartões' },
	B: { avg_seconds_per_ticket: 200, category_code: 'B', category_name: 'Carregamentos' },
	C: { avg_seconds_per_ticket: 180, category_code: 'C', category_name: 'Perdidos e Achados' },
	D: { avg_seconds_per_ticket: 230, category_code: 'D', category_name: 'Prioritário' },
	default: { avg_seconds_per_ticket: 200, category_code: 'N/A', category_name: 'Unknown' },
};

/* * */

export default async () => {
	//

	LOGGER.init();

	const globalTimer = new TIMETRACKER();

	// 1.
	// Retrieve existing ENCM documents from database

	const allEncmDocumentsTxt = await SERVERDB.client.get('datasets/facilities/encm/all');
	const allEncmDocumentsData = JSON.parse(allEncmDocumentsTxt);

	// 2.
	// Query IXAPI for all waiting tickets and open counters

	// Build a date string for the current time in the format ${year}-${month}-${day} ${hours}:${minutes}:${seconds}

	const currentDateString = DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss');
	const twoHoursAgoDateString = DateTime.now().minus({ hour: 2 }).toFormat('yyyy-MM-dd HH:mm:ss');

	console.log('currentDateString', currentDateString);
	console.log('twoHoursAgoDateString', twoHoursAgoDateString);

	const allEncmTicketsWaiting = await IXAPI.request({ finalDate: getIxDateString(), initialDate: getIxDateString(-7200), reportType: 'ticket', status: 'W' });
	const allEncmCounters = await IXAPI.request({ finalDate: getIxDateString(), initialDate: getIxDateString(-7200), reportType: 'siteReportByCounter' });

	// 3.
	// Add realtime status to each ENCM

	const allEncmData = [];

	for (const foundDocument of allEncmDocumentsData) {
		//

		// 3.1.
		// Filter all waiting tickets by the current ENCM id

		const encmTicketsWaiting = allEncmTicketsWaiting?.content?.ticket?.filter(item => item.siteEID === foundDocument.id);

		// 3.2.
		// Filter active counters for the current ENCM id, and deduplicate them

		const encmActiveCounters = allEncmCounters?.content?.siteReport?.filter((item) => {
			const siteEidMatchesEncmId = item.siteEID === foundDocument.id;
			const counterStatusMatches = item.counterStatus === 'A' || item.counterStatus === 'P' || item.counterStatus === 'O' || item.counterStatus === 'S';
			return siteEidMatchesEncmId && counterStatusMatches;
		});

		const encmActiveCountersUnique = Array.from(new Set(encmActiveCounters?.map(obj => obj.counterSID))).map(counterSID => encmActiveCounters.find(obj => obj.counterSID === counterSID));

		// 3.3.
		// Calculate the average wait time for the total tickets by category

		let encmTotalWaitTime = 0;

		encmTicketsWaiting?.forEach((ticket) => {
			if (ENCM_TIME_BY_CATEGORY[ticket.categoryCode]) {
				encmTotalWaitTime += ENCM_TIME_BY_CATEGORY[ticket.categoryCode].avg_seconds_per_ticket / (encmActiveCountersUnique.length || 1);
			}
			else {
				encmTotalWaitTime += ENCM_TIME_BY_CATEGORY.default.avg_seconds_per_ticket / (encmActiveCountersUnique.length || 1);
			}
		});

		// 3.4.
		// Format the update query with the request results

		const updatedDocument = {
			...foundDocument,
			active_counters: encmActiveCountersUnique.length,
			currently_waiting: encmTicketsWaiting?.length || 0,
			expected_wait_time: encmTotalWaitTime || 0,
			is_open: encmActiveCountersUnique.length > 0 ? true : false,
		};

		// 3.5.
		// Update the current document with the new values

		allEncmData.push(updatedDocument);
		await SERVERDB.client.set(`datasets/facilities/encm/${updatedDocument.id}`, JSON.stringify(updatedDocument));

		// Log progress
		LOGGER.info(`id: ${foundDocument.id} | currently_waiting: ${updatedDocument.currently_waiting} | expected_wait_time: ${updatedDocument.expected_wait_time} | active_counters: ${updatedDocument.active_counters} | is_open: ${updatedDocument.is_open} | name: ${foundDocument.name}`);
		//
	}

	// 4.
	// Save all documents

	const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
	allEncmData.sort((a, b) => collator.compare(a.id, b.id));
	await SERVERDB.client.set('datasets/facilities/encm/all', JSON.stringify(allEncmData));

	LOGGER.terminate(`Task completed: Updated ENCM status (${allEncmDocumentsData.length} documents in ${globalTimer.get()}).`);

	LOGGER.divider();

	//
};

/* * */

function getIxDateString(adjustmentSeconds = 0) {
	// Create a new date object
	const dateObj = new Date();
	// Apply the adjustment to the current date
	dateObj.setSeconds(dateObj.getSeconds() + adjustmentSeconds);
	// Get the components of the date
	const year = dateObj.getFullYear().toString().padStart(4, '0');
	const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
	const day = dateObj.getDate().toString().padStart(2, '0');
	const hours = dateObj.getHours().toString().padStart(2, '0');
	const minutes = dateObj.getMinutes().toString().padStart(2, '0');
	const seconds = dateObj.getSeconds().toString().padStart(2, '0');
	// Format the date string
	const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	// Return result
	return formattedDate;
	//
}
