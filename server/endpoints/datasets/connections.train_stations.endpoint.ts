/* * */

import SERVERDB from '@/services/SERVERDB.js';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.client.get('datasets/connections/train_stations/all');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const single = async (request, reply) => {
	const singleItem = await SERVERDB.client.get(`datasets/connections/train_stations/${request.params.id}`);
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
