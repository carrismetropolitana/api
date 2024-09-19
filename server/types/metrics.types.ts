export interface MonthlyMetrics {
	count: number
	month: number
	year: number
}

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

export interface OperatorMetrics {
	end_date: string
	operator_id: string
	start_date: string
	timestamp: number
	value: number
}
