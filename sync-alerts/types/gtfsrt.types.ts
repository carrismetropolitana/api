/* * */

export interface FeedHeader {
	gtfsRealtimeVersion: '2.0'
	incrementality: 'FULL_DATASET'
	timestamp: number
}

/* * */

export interface TranslatedString {
	translation: Translation[]
}

interface Translation {
	language: string
	text: string
}

/* * */

export interface TranslatedImage {
	localizedImage: LocalizedImage[]
}

interface LocalizedImage {
	language: string
	mediaType: string
	url: string
}

/* * */

export interface TimeRange {

	/*
	 * POSIX time (i.e., number of seconds since January 1st 1970 00:00:00 UTC). If start or end is missing,
	 * the interval starts at minus or plus infinity. If a TimeRange is provided, either start or end must
	 * be provided - both fields cannot be empty.
	 *
	 * Here, it is expected that a TimeRange object will always be provided with a start value.
	 *
	 * More info: https://gtfs.org/realtime/reference/#message-timerange
	 *
	 */

	end?: number
	start: number
}

/* * */

export interface EntitySelector {

	/*
	 * A selector for an entity in a GTFS feed. The values of the fields should correspond to the appropriate fields in the GTFS feed.
	 * At least one specifier must be given. If several are given, they should be interpreted as being joined by the logical AND operator.
	 * Additionally, the combination of specifiers must match the corresponding information in the GTFS feed.
	 * In other words, in order for an alert to apply to an entity in GTFS it must match all of the provided EntitySelector fields.
	 * For example, an EntitySelector that includes the fields route_id: "5" and route_type: "3" applies only
	 * to the route_id: "5" bus - it does not apply to any other routes of route_type: "3". If a producer wants an alert
	 * to apply to route_id: "5" as well as route_type: "3", it should provide two separate EntitySelectors,
	 * one referencing route_id: "5" and another referencing route_type: "3".
	 *
	 * More info: https://gtfs.org/realtime/reference/#message-entityselector
	 *
	 */

	agencyId?: string
	routeId?: string
	stopId?: string
	tripId?: string
}
