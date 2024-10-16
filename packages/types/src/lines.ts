/* * */

import { Locality } from './stops.js';

/* * */

export interface Line {
	color: string
	facilities: string[]
	line_id: string
	localities: Locality[]
	long_name: string
	pattern_ids: string[]
	route_ids: string[]
	short_name: string
	text_color: string
}
