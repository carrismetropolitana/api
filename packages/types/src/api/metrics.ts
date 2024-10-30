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
