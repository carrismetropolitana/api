/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const viewByDateForEachStop = async (_, reply) => {
	const viewData = await SERVERDB.client.get('datasets/demand/date-line-stop/viewByDateForEachStop');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(viewData || []);
};

const viewByDateForEachLine = async (_, reply) => {
	const viewData = await SERVERDB.client.get('datasets/demand/date-line-stop/viewByDateForEachLine');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(viewData || []);
};

const viewByDateForEachStopForEachLine = async (_, reply) => {
	const viewData = await SERVERDB.client.get('datasets/demand/date-line-stop/viewByDateForEachStopForEachLine');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(viewData || []);
};

/* * */

FASTIFY.server.get('/datasets/demand/date-line-stop/viewByDateForEachStop', viewByDateForEachStop);
FASTIFY.server.get('/datasets/demand/date-line-stop/viewByDateForEachLine', viewByDateForEachLine);
FASTIFY.server.get('/datasets/demand/date-line-stop/viewByDateForEachStopForEachLine', viewByDateForEachStopForEachLine);

FASTIFY.server.get('/v1/datasets/demand/date-line-stop/viewByDateForEachStop', viewByDateForEachStop);
FASTIFY.server.get('/v1/datasets/demand/date-line-stop/viewByDateForEachLine', viewByDateForEachLine);
FASTIFY.server.get('/v1/datasets/demand/date-line-stop/viewByDateForEachStopForEachLine', viewByDateForEachStopForEachLine);
