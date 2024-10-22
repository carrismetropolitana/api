/* * */

import { Cause, Effect, EntitySelector, TimeRange, TranslatedString } from 'gtfs-types';

/* * */

export interface TranslatedImage {
	localized_image: LocalizedImage[]
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
	media_type: string
	url: string
}

/* * */

/**
 * An Alert is the JSON equivalent of a GTFS-RT Service Alert message.
 * Please use a SimplifiedAlert as many convenience operations are already correctly applied.
 */
export interface Alert {
	active_period: TimeRange[]
	cause: Cause
	description_text: TranslatedString
	effect: Effect
	header_text: TranslatedString
	id: string
	image: TranslatedImage
	informed_entity: EntitySelector[]
	url: TranslatedString
}

/* * */

/**
 * A Simplified Alert is the same as an Alert, but with the following differences:
 * - The description is a string instead of a TranslatedString
 * - The image URL is a string instead of a TranslatedImage
 * - The URL is a string instead of a TranslatedString
 * - The start_date and end_date are Date objects instead of TimeRange objects
 * - All fields with translatable content are returned in the current app locale
 */
export interface SimplifiedAlert {
	cause: Cause
	description: string
	effect: Effect
	end_date: Date
	id: string
	image_url: null | string
	informed_entity: EntitySelector[]
	locale: string
	start_date: Date
	title: string
	url: null | string
}

/* * */

export interface AlertGroupByDate {
	items: Alert[]
	label?: string
	title: string
	value: string
}
