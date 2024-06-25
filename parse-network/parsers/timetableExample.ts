//

export interface TimetableEntry {
	exceptions: {
		id: string
	}[]
	time: string
}

export interface TimetablePeriod {
	period_id: string
	period_name: string
	saturdays: TimetableEntry[]
	sundays_holidays: TimetableEntry[]
	weekdays: TimetableEntry[]
}

export enum Facility {
	AIRPORT = 'airport',
	BIKE_PARKING = 'bike_parking',
	BIKE_SHARING = 'bike_sharing',
	BOAT = 'boat',
	CAR_PARKING = 'car_parking',
	LIGHT_RAIL = 'light_rail',
	NEAR_FIRE_STATION = 'near_fire_station',
	NEAR_HEALTH_CLINIC = 'near_health_clinic',
	NEAR_HISTORIC_BUILDING = 'near_historic_building',
	NEAR_HOSPITAL = 'near_hospital',
	NEAR_POLICE_STATION = 'near_police_station',
	NEAR_SCHOOL = 'near_school',
	NEAR_SHOPPING = 'near_shopping',
	NEAR_TRANSIT_OFFICE = 'near_transit_office',
	NEAR_UNIVERSITY = 'near_university',
	SUBWAY = 'subway',
	TRAIN = 'train',
}
export interface TimetableStop {
	facilities: Facility[]
	locality: string
	municipality_name: string
	stop_id: string
	stop_name: string
	stop_short_name: string
}

export interface Timetable {
	exceptions: {
		id: string
		label: string
		text: string
	}[]
	patternForDisplay: string
	periods: TimetablePeriod[]
	secondaryPatterns: string[]
}

// Example of a timetable
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const timetable: Timetable = {
	exceptions: [
		{ id: 'a', label: 'a)', text: 'Apenas no primeiro domingo do mês.' },
		{ id: 'b', label: 'b)', text: 'Apenas no segundo domingo do mês.' },
	],
	patternForDisplay: '1000_1',
	periods: [
		{
			period_id: '1',
			period_name: 'Período Escolar',
			saturdays: [
				{
					exceptions: [
					],
					time: '08:01',
				},
				{
					exceptions: [
						{ id: 'a' },
					],
					time: '08:23',
				},
				{
					exceptions: [
					],
					time: '09:04',
				},
				{
					exceptions: [
						{ id: 'b' },
					],
					time: '09:23',
				},
			],
			sundays_holidays: [
				{
					exceptions: [
					],
					time: '08:01',
				},
				{
					exceptions: [
						{ id: 'a' },
					],
					time: '08:23',
				},
				{
					exceptions: [
					],
					time: '09:04',
				},
				{
					exceptions: [
						{ id: 'b' },
					],
					time: '09:23',
				},
			],
			weekdays: [
				{
					exceptions: [
					],
					time: '08:01',
				},
				{
					exceptions: [
						{ id: 'a' },
					],
					time: '08:23',
				},
				{
					exceptions: [
					],
					time: '09:04',
				},
				{
					exceptions: [
						{ id: 'b' },
					],
					time: '09:23',
				},
			],
		},
		{
			period_id: '2',
			period_name: 'Período de Férias Escolares',
			saturdays: [
				{
					exceptions: [
					],
					time: '08:01',
				},
				{
					exceptions: [
						{ id: 'a' },
					],
					time: '08:23',
				},
				{
					exceptions: [
					],
					time: '09:04',
				},
				{
					exceptions: [
						{ id: 'b' },
					],
					time: '09:23',
				},
			],
			sundays_holidays: [
				{
					exceptions: [
					],
					time: '08:01',
				},
				{
					exceptions: [
						{ id: 'a' },
					],
					time: '08:23',
				},
				{
					exceptions: [
					],
					time: '09:04',
				},
				{
					exceptions: [
						{ id: 'b' },
					],
					time: '09:23',
				},
			],
			weekdays: [
				{
					exceptions: [
					],
					time: '08:01',
				},
				{
					exceptions: [
						{ id: 'a' },
					],
					time: '08:23',
				},
				{
					exceptions: [
					],
					time: '09:04',
				},
				{
					exceptions: [
						{ id: 'b' },
					],
					time: '09:23',
				},
			],
		},
	],
	secondaryPatterns: [
		'1000_2',
	],
};
