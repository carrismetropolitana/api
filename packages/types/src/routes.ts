/* * */

import { Locality } from './api/locations.js';

/* * */

export interface Route {
	color: string
	facilities: string[]
	line_id: string
	localities: Locality[]
	long_name: string
	pattern_ids: string[]
	route_id: string
	short_name: string
	text_color: string
}
