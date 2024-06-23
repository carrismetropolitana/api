/* * */

import SERVERDB from '@/services/SERVERDB.js';

/* * */

const all = async (_, reply) => {
	// Disabled endpoint
	return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send([]);
};

const index = async (_, reply) => {
	const index = await SERVERDB.client.get(`timetables:index`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(index || null);
};

const single = async (request, reply) => {
	// 4512/010136
	const singleItem = await SERVERDB.client.get(`timetables:${request.params.line_id}/${request.params.direction_id}/${request.params.stop_id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || null);
};

/* * */

export default {
	all,
	index,
	single,
};
