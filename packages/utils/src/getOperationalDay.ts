/* * */

import { DateTime } from 'luxon';

/* * */

export function getOperationalDay(timestamp?: string, format?: string): string {
	//

	// Parse the transaction date using the provided format
	let dateObject: DateTime;

	if (!timestamp || !format) {
		dateObject = DateTime.now();
	}
	else {
		dateObject = DateTime.fromFormat(timestamp, format);
	}

	// Check if the time is between 00:00 and 03:59
	if (dateObject.hour < 4) {
		// If true, return the previous day in the yyyyLLdd format
		const previousDay = dateObject.minus({ days: 1 });
		return previousDay.toFormat('yyyyLLdd');
	}
	else {
		// Else, return the current day in the yyyyLLdd format
		return dateObject.toFormat('yyyyLLdd');
	}

	//
}
