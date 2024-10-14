/* * */

import { DateTime } from 'luxon';

/* * */

export default {
	//

	compensate24HourRegularStringInto24HourPlusOperationTimeString: (regularTimeString: string): string => {
		//

		// Return early if no time string is provided
		if (!regularTimeString) return null;

		// Extract the individual components of the time string (HH:MM:SS)
		const [hoursOperation, minutesOperation, secondsOperation] = regularTimeString.split(':').map(Number);

		// If the 24-hour string is between 0 and 4, it means that the service is actually on the day before.
		// In this case, we need to add 24 hours to the time string, to compensate for the day before
		if (hoursOperation >= 0 && hoursOperation < 4) {
			const compensatedHoursOperation = hoursOperation + 24;
			const compensatedMinutesOperation = minutesOperation;
			const compensatedSecondsOperation = secondsOperation;
			return `${compensatedHoursOperation.toString().padStart(2, '0')}:${compensatedMinutesOperation.toString().padStart(2, '0')}:${compensatedSecondsOperation.toString().padStart(2, '0')}`;
		}

		return `${hoursOperation.toString().padStart(2, '0')}:${minutesOperation.toString().padStart(2, '0')}:${secondsOperation.toString().padStart(2, '0')}`;

		//
	},

	convert24HourPlusOperationTimeStringToUnixTimestamp: (operationTimeString: string): number => {
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
		if (theDateTimeObject.hour >= 0 && theDateTimeObject.hour < 4) {
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
