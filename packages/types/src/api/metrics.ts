interface ByHour {
	hour: number
	qty: number
}

interface ByDay {
	day: string
	qty: number
	by_hour: ByHour[]
}

export interface DemandMetrics {
	by_day: ByDay[]
	end_date: string
	start_date: string
	total_qty: number
    item_id: string
};
