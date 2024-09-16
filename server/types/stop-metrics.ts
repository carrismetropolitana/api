export interface StopMetrics {
	by_hour: {
		hour: number
		qty: number
	}
	end_date: string
	start_date: string
	stop_id: string
	total_qty: number
}
