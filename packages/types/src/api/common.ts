/* * */

export interface CachedResource<T> {
	data: T
	timestamp_resource: number
}

// interface ApiResponseSuccess<T> extends CachedResource<T> {
// 	status: 'success'
// 	timestamp_server: number
// }

// interface ApiResponseError {
// 	message: string
// 	status: 'error'
// 	timestamp_resource: -1
// 	timestamp_server: number
// }

// export type ApiResponse<T> = ApiResponseError | ApiResponseSuccess<T>;
