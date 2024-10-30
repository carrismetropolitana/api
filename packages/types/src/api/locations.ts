/* * */

export interface Region {
	id: string
	name: string
}

export interface District {
	id: string
	name: string
	region_id: string
}

export interface Municipality {
	district_id: string
	id: string
	name: string
	region_id: string
}

export interface Locality {
	display: string
	district_id: string
	id: string
	municipality_id: string
	name: string
	region_id: string
}
