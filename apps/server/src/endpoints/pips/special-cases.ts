/* * */

import { createPipArrivalResponseItem, PipArrivalResponseItem } from './types.js';

/* * */

/**
 * Returns a canned response for known special-case stop IDs used in PIP testing.
 * Returns null when none of the given stop IDs match a special case.
 */
export function getSpecialCaseResponse(stops: string[]): PipArrivalResponseItem[] | null {
	//

	for (const stopId of stops) {
		//

		//
		// Handle the special case for testing PIP connectivity
		// If the stop ID is '000000', return a single test estimate

		if (stopId === '000000') {
			return [
				createPipArrivalResponseItem({
					estimatedTimeString: 'TEST',
					lineId: '0000',
					stopHeadsign: 'Olá :)',
				}),
				createPipArrivalResponseItem({
					estimatedTimeString: '›››',
				}),
			];
		}

		//
		// Handle the special case for testing PIP downtime
		// If the stop ID is '000001', return an informational error message

		if (stopId === '000001') {
			return [
				createPipArrivalResponseItem({
					estimatedTimeString: '1 min',
					lineId: 'INFO',
					stopHeadsign: 'Sem estimativas. Consulte site para +info.',
				}),
			];
		}

		//
		// Handle the special case for a deactivated stop / inactive panel

		if (stopId === 'no-service') {
			return [
				createPipArrivalResponseItem({
					estimatedTimeString: '',
					lineId: 'INFO',
					observedVehicleId: '0000',
					patternId: '0000_0_0',
					stopHeadsign: 'Paragem desativada.',
				}),
				createPipArrivalResponseItem({
					estimatedTimeString: '',
					lineId: 'INFO',
					observedVehicleId: '0000',
					patternId: '0000_0_0',
					stopHeadsign: 'Painel inativo.',
				}),
			];
		}
	}

	return null;

	//
}
