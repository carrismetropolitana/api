/* * */

import { DateTime } from 'luxon';

/* * */

export default function getOperationalDay(timestamp: string, format: string) {
//

	// Parse the transaction date using the provided format
	const transactionDate = DateTime.fromFormat(timestamp, format);

	// Check if the time is between 00:00 and 03:59
	if (transactionDate.hour < 4) {
		// If true, return the previous day in the yyyyLLdd format
		const previousDay = transactionDate.minus({ days: 1 });
		return previousDay.toFormat('yyyyLLdd');
	}
	else {
		// Else, return the current day in the yyyyLLdd format
		return transactionDate.toFormat('yyyyLLdd');
	}

	//
}
