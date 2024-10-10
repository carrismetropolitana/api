/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const byLine = async (request, reply) => {
	const lineId = request.params.lineId;
	const operationalDay = request.params.operationalDay || 'all';

	const metrics = await SERVERDB.client.get(`v2:metrics:sla:${lineId}:${operationalDay}`);

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
	const metric = await SERVERDB.client.get(`v2:metrics:sla:all`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(metric);
};

/* * */

FASTIFY.server.get('/v2/metrics/sla/byLine/:lineId', byLine);
FASTIFY.server.get('/v2/metrics/sla/byLine/:lineId/:operationalDay', byLine);
FASTIFY.server.get('/v2/metrics/sla/all', all);
