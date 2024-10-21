/* * */

export interface FacilitySource {
	district_id: string
	district_name: string
	id: string
	lat: string
	locality: string
	lon: string
	municipality_id: string
	municipality_name: string
	name: string
	parish_id: string
	parish_name: string
	region_id: string
	region_name: string
	stops: string
}

export interface Facility {
	district_id: string
	district_name: string
	id: string
	lat: number
	locality: string
	lon: number
	municipality_id: string
	municipality_name: string
	name: string
	parish_id: string
	parish_name: string
	region_id: string
	region_name: string
	stop_ids: string[]
}

/* * */

export interface SchoolsSource extends FacilitySource {
	address: string
	cicles: string
	email: string
	grouping: string
	nature: string
	phone: string
	postal_code: string
	url: string
}

export interface School extends Facility {
	address: string
	cicles: string
	email: string
	grouping: string
	nature: string
	phone: string
	url: string
}
