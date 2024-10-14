/* * */

import FASTIFY from '@/services/FASTIFY.js';
import { DateTime } from 'luxon';

/* * */

const main = async (_, reply) => {
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(
			JSON.stringify({
				now_minus_5_minutes: DateTime.now().setZone('Europe/Lisbon').minus({ minutes: 5 }).toFormat('yyyyLLddHHmm'),
				now_minus_20_seconds: DateTime.now().minus({ seconds: 20 }).toUnixInteger(),
				now_minus_90_seconds: DateTime.now().minus({ seconds: 90 }).toUnixInteger(),
				now_unix_int: DateTime.now().toUnixInteger(),
			}),
		);
};

/* * */

FASTIFY.server.get('/status/time', main);

FASTIFY.server.get('/v2/status/time', main);
