/* * */

import { DateTime } from 'luxon';

/* * */

export default {
	//

	convert24HourPlusOperationTimeStringToUnixTimestamp: (operationTimeString: string, use24HourPlusString = true) => {
		//

		// Return early if no time string is provided
		if (!operationTimeString) return null;

		// Extract the individual components of the time string (HH:MM:SS)
		const [hoursOperation, minutesOperation, secondsOperation] = operationTimeString.split(':').map(Number);

		// Because the operational time string can be greater than 24 (expressing an operational day after midnight, or longer),
		// calculate how many days are in the hour component, and how many hours are left after the parsing
		const daysInTheHourComponent = Math.floor(hoursOperation / 24);
		const hoursLeftAfterDayConversion = hoursOperation % 24;

		// Setup a new DateTime (luxon) object
		let theDateTimeObject = DateTime.local({ zone: 'Europe/Lisbon' });

		// Since this is a on-the-fly conversion, there is the case where the server time will be between 00 and 04,
		// in which case we need to set the DateTime object as the day before, before applying the actual time component calculations
		if (use24HourPlusString && theDateTimeObject.hour >= 0 && theDateTimeObject.hour < 4) {
			theDateTimeObject = theDateTimeObject.set({ day: theDateTimeObject.day - 1 });
		}

		// Apply the date components previously calculated
		theDateTimeObject = theDateTimeObject.set({
			hour: hoursLeftAfterDayConversion,
			minute: minutesOperation,
			second: secondsOperation,
		});

		// If the time string represents a service in another day (but in the same operational day),
		// add the corresponding amount of days to the DateTime object
		if (daysInTheHourComponent > 0) {
			theDateTimeObject = theDateTimeObject.plus({ days: daysInTheHourComponent });
		}

		// Return the DateTime object as a Unix timestamp in the UTC timezone
		return theDateTimeObject.toUTC().toUnixInteger();

		//
	},

	//
};
