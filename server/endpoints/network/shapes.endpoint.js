/* * */

import SERVERDB from '@/services/SERVERDB';

/* * */

const all = async (_, reply) => {
	// Disabled endpoint
	return reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send([]);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`shapes:${request.params.id}`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(singleItem || {});
};

/* * */

export default {
	all,
	single,
};
