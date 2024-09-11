/* * */

import { EntitySelector, TimeRange, TranslatedImage, TranslatedString } from '@/types/gtfsrt.types.js';

/* * */

export enum AlertCause {
	ACCIDENT = 'ACCIDENT',
	CONSTRUCTION = 'CONSTRUCTION',
	DEMONSTRATION = 'DEMONSTRATION',
	HOLIDAY = 'HOLIDAY',
	MAINTENANCE = 'MAINTENANCE',
	MEDICAL_EMERGENCY = 'MEDICAL_EMERGENCY',
	OTHER_CAUSE = 'OTHER_CAUSE',
	POLICE_ACTIVITY = 'POLICE_ACTIVITY',
	STRIKE = 'STRIKE',
	TECHNICAL_PROBLEM = 'TECHNICAL_PROBLEM',
	UNKNOWN_CAUSE = 'UNKNOWN_CAUSE',
	WEATHER = 'WEATHER',
}

export enum AlertEffect {
	ACCESSIBILITY_ISSUE = 'ACCESSIBILITY_ISSUE',
	ADDITIONAL_SERVICE = 'ADDITIONAL_SERVICE',
	DETOUR = 'DETOUR',
	MODIFIED_SERVICE = 'MODIFIED_SERVICE',
	NO_EFFECT = 'NO_EFFECT',
	NO_SERVICE = 'NO_SERVICE',
	OTHER_EFFECT = 'OTHER_EFFECT',
	REDUCED_SERVICE = 'REDUCED_SERVICE',
	SIGNIFICANT_DELAYS = 'SIGNIFICANT_DELAYS',
	STOP_MOVED = 'STOP_MOVED',
	UNKNOWN_EFFECT = 'UNKNOWN_EFFECT',
}

/* * */

/**
 * An Alert is the JSON equivalent of a GTFS-RT Service Alert message.
 * Please use a SimplifiedAlert as many convenience operations are already correctly applied.
 */
export interface Alert {
	activePeriod: TimeRange[]
	alert_id: string
	cause: AlertCause
	descriptionText: TranslatedString
	effect: AlertEffect
	headerText: TranslatedString
	image: TranslatedImage
	informedEntity: EntitySelector[]
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
	alert_id: string
	cause: AlertCause
	description: string
	effect: AlertEffect
	end_date: Date
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
