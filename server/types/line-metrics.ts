export interface LineMetrics {
	by_hour: {
		hour: number
		qty: number
	}
	end_date: string
	line_id: string
	start_date: string
	total_qty: number
}
