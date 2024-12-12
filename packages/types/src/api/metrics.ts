/* * */

export interface ServiceMetricsSource {
	agency_id: string
	line_id: string
	operational_date: string
	pass_trip_count: string
	pass_trip_percentage: string
	total_trip_count: string
}

export interface ServiceMetrics {
	agency_id: string
	line_id: string
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
