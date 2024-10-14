/* * */

import FASTIFY from '@/services/FASTIFY.js';
import { SERVERDB } from '@api/services';


/* * */

const byLine = async (request, reply) => {
	const lineId = request.params.lineId;
	const operationalDay = request.params.operationalDay || 'all';

	const metrics = await SERVERDB.client.get(`v2:metrics:service:${lineId}:${operationalDay}`);

	if (!metrics) {
		return reply
			.code(404)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ message: 'Not found' });
	}

	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(metrics);
};

const all = async (request, reply) => {
	const metric = await SERVERDB.client.get(`v2:metrics:service:all`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(metric);
};

/* * */

FASTIFY.server.get('/v2/metrics/service/by_line/:lineId', byLine);
FASTIFY.server.get('/v2/metrics/service/by_line/:lineId/:operationalDay', byLine);
FASTIFY.server.get('/v2/metrics/service/all', all);
