/* * */

export interface Region {
	region_id: string
	region_name: string
}

export interface District extends Region {
	district_id: string
	district_name: string
}

export interface Municipality extends District {
	municipality_id: string
	municipality_name: string
}

export interface Locality extends Municipality {
	display: string
	locality_id: string
	locality_name: string
}
