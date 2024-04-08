//

export type TimetableEntry = {
  time: string;
  exceptions: {
    id: string;
  }[];
};

export type TimetablePeriod = {
  period_id: string;
  period_name: string;
  weekdays: TimetableEntry[];
  saturdays: TimetableEntry[];
  sundays_holidays: TimetableEntry[];
};

export enum Facility {
	NEAR_HEALTH_CLINIC = 'near_health_clinic',
	NEAR_HOSPITAL = 'near_hospital',
	NEAR_UNIVERSITY = 'near_university',
	NEAR_SCHOOL = 'near_school',
	NEAR_POLICE_STATION = 'near_police_station',
	NEAR_FIRE_STATION = 'near_fire_station',
	NEAR_SHOPPING = 'near_shopping',
	NEAR_HISTORIC_BUILDING = 'near_historic_building',
	NEAR_TRANSIT_OFFICE = 'near_transit_office',
	LIGHT_RAIL = 'light_rail',
	SUBWAY = 'subway',
	TRAIN = 'train',
	BOAT = 'boat',
	AIRPORT = 'airport',
	BIKE_SHARING = 'bike_sharing',
	BIKE_PARKING = 'bike_parking',
	CAR_PARKING = 'car_parking',
}
export type TimetableStop = {
	stop_id: string;
	stop_short_name: string;
	stop_name: string;
	locality: string;
	municipality_name: string;
	facilities: Facility[];
};

export type Timetable = {
  periods: TimetablePeriod[],
  exceptions: {
    id: string;
    label: string;
    text: string;
  }[];
	patternForDisplay: string;
};

// Example of a timetable
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const timetable: Timetable = {
	periods: [
		{
			period_id: '1',
			period_name: 'Período Escolar',
			weekdays: [
				{
					time: '08:01', exceptions: [],
				},
				{
					time: '08:23', exceptions: [{ id: 'a' }],
				},
				{
					time: '09:04', exceptions: [],
				},
				{
					time: '09:23', exceptions: [{ id: 'b' }],
				},
			],
			saturdays: [
				{
					time: '08:01', exceptions: [],
				},
				{
					time: '08:23', exceptions: [{ id: 'a' }],
				},
				{
					time: '09:04', exceptions: [],
				},
				{
					time: '09:23', exceptions: [{ id: 'b' }],
				},
			],
			sundays_holidays: [
				{
					time: '08:01', exceptions: [],
				},
				{
					time: '08:23', exceptions: [{ id: 'a' }],
				},
				{
					time: '09:04', exceptions: [],
				},
				{
					time: '09:23', exceptions: [{ id: 'b' }],
				},
			],
		},
		{
			period_id: '2',
			period_name: 'Período de Férias Escolares',
			weekdays: [
				{
					time: '08:01', exceptions: [],
				},
				{
					time: '08:23', exceptions: [{ id: 'a' }],
				},
				{
					time: '09:04', exceptions: [],
				},
				{
					time: '09:23', exceptions: [{ id: 'b' }],
				},
			],
			saturdays: [
				{
					time: '08:01', exceptions: [],
				},
				{
					time: '08:23', exceptions: [{ id: 'a' }],
				},
				{
					time: '09:04', exceptions: [],
				},
				{
					time: '09:23', exceptions: [{ id: 'b' }],
				},
			],
			sundays_holidays: [
				{
					time: '08:01', exceptions: [],
				},
				{
					time: '08:23', exceptions: [{ id: 'a' }],
				},
				{
					time: '09:04', exceptions: [],
				},
				{
					time: '09:23', exceptions: [{ id: 'b' }],
				},
			],
		},
	],
	exceptions: [
		{ id: 'a', label: 'a)', text: 'Apenas no primeiro domingo do mês.' },
		{ id: 'b', label: 'b)', text: 'Apenas no segundo domingo do mês.' },
	],
	patternForDisplay: '1000_1',
};