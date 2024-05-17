/* * */

import { DateTime } from 'luxon';

/* * */

const time = async (_, reply) => {
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(
			JSON.stringify({
				now_minus_20_seconds: DateTime.now().minus({ seconds: 20 }).toUnixInteger(),
				now_minus_5_minutes: DateTime.now().setZone('Europe/Lisbon').minus({ minutes: 5 }).toFormat('yyyyLLddHHmm'),
				now_unix_int: DateTime.now().toUnixInteger(),
				now_minus_90_seconds: DateTime.now().minus({ seconds: 90 }).toUnixInteger(),
			}),
		);
};

/* * */

export default {
	time,
};