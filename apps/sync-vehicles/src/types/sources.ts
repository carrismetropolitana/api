/* * */

import { GTFSBool } from '@carrismetropolitana/api-types/gtfs-core';

/* * */

export interface VehicleMetadataSource {
	agency_id: string
	bikes_allowed: GTFSBool
	capacity_seated: string
	capacity_standing: string
	emission_class: string
	license_plate: string
	make: string
	model: string
	owner: string
	passenger_counting: string
	propulsion: string
	registration_date: string
	vehicle_id: string
	wheelchair_accessible: GTFSBool
}
