/* * */

import { Cause, Effect } from '@tmlmobilidade/types';

export interface ServiceMetrics {
	agency_id: string
	line_id: number
	operational_date: string
	pass_trip_count: number
	pass_trip_percentage: number
	total_trip_count: number
}

/* * */

export interface DemandMetricsByLine {
	by_day: ByDay[]
	end_date: string
	line_id: string
	qty: number
	start_date: string
}

export interface DemandMetricsByStop {
	by_day: ByDay[]
	end_date: string
	qty: number
	start_date: string
	stop_id: string
}

/* * */

export interface DemandMetricsByAgency {
	agency_id: string
	data: DemandMetricsByAgencyDay[] | DemandMetricsByAgencyMonth[] | DemandMetricsByAgencyYear[]
}

export interface DemandMetricsByAgencyDay {
	hour_group: string
	qty: number
}

export interface DemandMetricsByAgencyMonth {
	day_group: string
	qty: number
}

export interface DemandMetricsByAgencyYear {
	month_group: string
	qty: number
}

/* * */

interface ByHour {
	hour: number
	qty: number
}

interface ByDay {
	by_hour: ByHour[]
	day: string
	qty: number
}

/* * */

export interface ComplaintMetrics {
	_id: string
	complaints: number
	email: number
	filter_value: string
	info_requests: number
	last_update: string
	other: number
	phone: number
	total: number
	type: string
}

/* ALERT METRICS */

export interface AlertsSummary {
	external_causes_percentage: number
	people_affected: number
	total_alerts: number
}

export interface AlertsCauseEffect {
	cause: Cause
	effects: { type: Effect, value: number }[]
	total: number
}

export interface AlertsEvolution {
	day_group: string
	lines_affected: number
	people_affected: number
}

export interface AlertsByMunicipality {
	causes: { type: Cause, value: number }[]
	municipality_id: string
	total: number
}
