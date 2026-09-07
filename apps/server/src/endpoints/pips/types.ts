/* * */

export interface PipArrivalRequestSchema {
	Body: {
		stops: string[]
	}
}

export interface PipArrivalResponseItem {
	estimatedArrivalTime: string
	estimatedDepartureTime: string
	estimatedTimeString: string
	estimatedTimeUnixSeconds: number
	journeyId: string
	lineId: string
	observedArrivalTime: string
	observedDepartureTime: string
	observedDriverId: string
	observedVehicleId: string
	operatorId: string
	patternId: string
	stopHeadsign: string
	stopId: string
	timetabledArrivalTime: string
	timetabledDepartureTime: string
}

/* * */

export const createPipArrivalResponseItem = (overrides: Partial<PipArrivalResponseItem> = {}): PipArrivalResponseItem => ({
	estimatedArrivalTime: '23:59:59',
	estimatedDepartureTime: '23:59:59',
	estimatedTimeString: '1 min',
	estimatedTimeUnixSeconds: 0,
	journeyId: '0000_0_0|teste',
	lineId: '0000',
	observedArrivalTime: null,
	observedDepartureTime: null,
	observedDriverId: '',
	observedVehicleId: '0000',
	operatorId: '',
	patternId: '0000_0_0',
	stopHeadsign: 'Olá :)',
	stopId: '',
	timetabledArrivalTime: '23:59:59',
	timetabledDepartureTime: '23:59:59',
	...overrides,
});
