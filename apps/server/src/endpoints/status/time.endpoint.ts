/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { DateTime } from 'luxon';

/* * */

FASTIFY.GET('/status/time', async (_, reply) => {
	return reply
		.code(200)
		.header('cache-control', 'public, max-age=5')
		.send(
			JSON.stringify({
				now_minus_5_minutes: DateTime.now().setZone('Europe/Lisbon').minus({ minutes: 5 }).toFormat('yyyyLLddHHmm'),
				now_minus_20_seconds: DateTime.now().minus({ seconds: 20 }).toUnixInteger(),
				now_minus_90_seconds: DateTime.now().minus({ seconds: 90 }).toUnixInteger(),
				now_unix_int: DateTime.now().toUnixInteger(),
			}),
		);
});
