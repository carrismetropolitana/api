/* * */

export interface ServiceMetricsSource {
	agency_id: string
	line_id: string
	operational_day: string
	pass_trip_count: string
	pass_trip_percentage: string
	total_trip_count: string
}

export interface ServiceMetrics {
	agency_id: string
	line_id: string
	operational_day: string
	pass_trip_count: number
	pass_trip_percentage: number
	total_trip_count: number
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

export interface DemandMetrics {
	by_day: ByDay[]
	end_date: string
	item_id: string
	start_date: string
	total_qty: number
};
