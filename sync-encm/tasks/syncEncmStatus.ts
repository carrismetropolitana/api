//
import IXAPI from '@/services/IXAPI.js';
import SERVERDB from '@/services/SERVERDB.js';
import TIMETRACKER from '@helperkits/timer';

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
	// Setup flag to avoid overlapping runs
	const RUN_ON_INTERVAL = 30000;
	// Setup flag to avoid overlapping runs
	let TASK_IS_RUNNING = false;
	// Schedule task (https://crontab.guru/#*_*_*_*_*)
	setInterval(async () => {
		// Check if task is already running
		if (TASK_IS_RUNNING) throw new Error('Force restart program.');
		// Switch the flag ON
		TASK_IS_RUNNING = true;
		// Record the start time to later calculate operation duration
		console.log();
		console.log(`------------------------------------------------------------------------------------------------------------------------`);
		console.log(`→ Updating ENCM status...`);
		const globalTimer = new TIMETRACKER();
		// Retrieve ENCM from database
		const foundManyDocuments_raw = await SERVERDB.client.get('datasets/facilities/encm/all');
		const foundManyDocuments = JSON.parse(foundManyDocuments_raw);
		// Query IXAPI for the status of the requested ENCM
		const allEncmTicketsWaiting = await IXAPI.request({ finalDate: getIxDateString(), initialDate: getIxDateString(-7200), reportType: 'ticket', status: 'W' });
		// Get open counters in each store
		const allEncmCounters = await IXAPI.request({ finalDate: getIxDateString(), initialDate: getIxDateString(-7200), reportType: 'siteReportByCounter' });
		// Add realtime status to each ENCM
		const allEncmData = [];
		// Add realtime status to each ENCM
		for (const foundDocument of foundManyDocuments) {
			// Filter all waiting tickets by the current ENCM id
			const encmTicketsWaiting = allEncmTicketsWaiting?.content?.ticket?.filter(item => item.siteEID === foundDocument.id);
			// Filter active counters for the current ENCM id, and deduplicate them
			const encmActiveCounters = allEncmCounters?.content?.siteReport?.filter(item => item.siteEID === foundDocument.id && (item.counterStatus === 'A' || item.counterStatus === 'P' || item.counterStatus === 'O' || item.counterStatus === 'S'));
			const encmActiveCountersUnique = Array.from(new Set(encmActiveCounters?.map(obj => obj.counterSID))).map(counterSID => encmActiveCounters.find(obj => obj.counterSID === counterSID));
			// Calculate the average wait time for the total tickets by category
			let encmTotalWaitTime = 0;
			encmTicketsWaiting?.forEach((ticket) => {
				if (ENCM_TIME_BY_CATEGORY[ticket.categoryCode]) encmTotalWaitTime += ENCM_TIME_BY_CATEGORY[ticket.categoryCode].avg_seconds_per_ticket / (encmActiveCountersUnique.length || 1);
				else encmTotalWaitTime += ENCM_TIME_BY_CATEGORY.default.avg_seconds_per_ticket / (encmActiveCountersUnique.length || 1);
			});
			// Format the update query with the request results
			const updatedDocument = {
				...foundDocument,
				active_counters: encmActiveCountersUnique.length,
				currently_waiting: encmTicketsWaiting?.length || 0,
				expected_wait_time: encmTotalWaitTime || 0,
				is_open: encmActiveCountersUnique.length > 0 ? true : false,
			};
			// Update the current document with the new values
			allEncmData.push(updatedDocument);
			await SERVERDB.client.set(`datasets/facilities/encm/${updatedDocument.id}`, JSON.stringify(updatedDocument));
			// Log progress
			console.log(`→ id: ${foundDocument.id} | currently_waiting: ${updatedDocument.currently_waiting} | expected_wait_time: ${updatedDocument.expected_wait_time} | active_counters: ${updatedDocument.active_counters} | is_open: ${updatedDocument.is_open} | name: ${foundDocument.name}`);
			//
		}
		// Save all documents
		const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
		allEncmData.sort((a, b) => collator.compare(a.id, b.id));
		await SERVERDB.client.set('datasets/facilities/encm/all', JSON.stringify(allEncmData));
		// Switch the flag OFF
		TASK_IS_RUNNING = false;
		// Log elapsed time in the current operation
		console.log(`→ Task completed: Updated ENCM status (${foundManyDocuments.length} documents in ${globalTimer.get()}).`);
		console.log(`------------------------------------------------------------------------------------------------------------------------`);
		console.log();

		//
	}, RUN_ON_INTERVAL);

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
