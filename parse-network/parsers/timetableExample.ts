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

export type Timetable = {
  periods: TimetablePeriod[],
  exceptions: {
    id: string;
    label: string;
    text: string;
  }[];
};

// Example of a timetable
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
};