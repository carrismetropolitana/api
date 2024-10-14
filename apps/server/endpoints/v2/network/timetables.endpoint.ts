/* * */

import FASTIFY from '@/services/FASTIFY.js';
import { SERVERDB } from '@api/services';


/* * */

const index = async (_, reply) => {
	const index = await SERVERDB.client.get(`v2:network:timetables:index`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(index || null);
};

const single = async (request, reply) => {
	// 4512/010136
	const singleItem = await SERVERDB.client.get(`v2:network:timetables:${request.params.line_id}/${request.params.direction_id}/${request.params.stop_id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || null);
};

/* * */

FASTIFY.server.get('/v2/timetables', index);
FASTIFY.server.get('/v2/timetables/:line_id/:direction_id/:stop_id', single);
