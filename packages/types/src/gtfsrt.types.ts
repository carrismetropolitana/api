/**
 * GTFS Realtime Feed Message Types
 */
export interface FeedHeader {
	gtfsRealtimeVersion: '2.0'
	incrementality: 'FULL_DATASET'
	timestamp: number
}

export interface TranslatedString {
	translation: Translation[]
}

/**
 * A translation of a string. Exactly one of text or file must be present.
 * The language field must be a valid BCP 47 language tag.
 *
 * More info: https://gtfs.org/realtime/reference/#message-translation
 *
 * @param language - The language of the text. Must be a valid BCP 47 language tag.
 * @param text - The translated text.
 *
 */
interface Translation {
	language: string
	text: string
}

export interface TranslatedImage {
	localizedImage: LocalizedImage[]
}

/**
 * A localized image. At least one translation must be provided.
 * The image type must be a valid MIME type. The URL must be a valid URL.
 * The language field must be a valid BCP 47 language tag.
 *
 * More info: https://gtfs.org/realtime/reference/#message-localizedimage
 *
 * @param language - The language of the image. Must be a valid BCP 47 language tag.
 * @param mediaType - The MIME type of the image.
 * @param url - The URL of the image.
 *
 */
interface LocalizedImage {
	language: string
	mediaType: string
	url: string
}

/**
 * POSIX time (i.e., number of seconds since January 1st 1970 00:00:00 UTC). If start or end is missing,
 * the interval starts at minus or plus infinity. If a TimeRange is provided, either start or end must
 * be provided - both fields cannot be empty.
 *
 * Here, it is expected that a TimeRange object will always be provided with a start value.
 *
 * More info: https://gtfs.org/realtime/reference/#message-timerange
 *
 * @param start - Start time in POSIX time.
 * @param end - End time in POSIX time. If not provided, the interval ends at plus infinity.
 *
 */
export interface TimeRange {
	end?: number
	start: number
}

/**
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
 * @param agencyId - The agency_id of the agency that operates the entity. Required if the entity is not identified by a specific route_id.
 * @param lineId - The line_id of the line that the entity belongs to. Non-standard.
 * @param routeId - The route_id of the route that the entity belongs to.
 * @param stopId - The stop_id of the stop that the entity is associated with. Optional.
 * @param tripId - The trip_id of the trip that the entity belongs to. Required if the entity is not identified by route_id.
 *
 */
export interface EntitySelector {
	agencyId?: string
	lineId?: string // Non-standard
	routeId?: string
	stopId?: string
	tripId?: string
}
