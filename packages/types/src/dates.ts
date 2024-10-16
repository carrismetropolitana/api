/* * */

export interface Date {
	date: string
	day_type: DayType
	description: string
	holiday: boolean
	period: string
}

export enum DayType {
	saturday = '2',
	sundayOrHoliday = '3',
	weekday = '1',
}

export enum PeriodType {
	schoolOff = '2',
	schoolOn = '1',
	summer = '3',
}

/* * */

export interface ValidityGroup {
	valid_from: string
	valid_until?: string
}

export interface Period {
	dates: string[]
	period_id: string
	period_name: string
	validity_groups: ValidityGroup[]
}
