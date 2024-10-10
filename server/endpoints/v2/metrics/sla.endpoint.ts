/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';

/* * */

const byLine = async (request, reply) => {
	const lineId = request.params.line_id;
	const operationalDay = request.params.operational_day || 'all';

	const metric = await SERVERDB.client.get(`v2:metrics:sla:${lineId}:${operationalDay}`);

	if (!metric) {
		return reply
			.code(404)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ message: 'Not found' });
	}

	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(metric);
};

const all = async (_, reply) => {
	const metric = await SERVERDB.client.get(`v2:metrics:sla:all`);
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(metric);
};

/* * */

FASTIFY.server.get('/v2/metrics/sla/by_line/:line_id/:operational_day', byLine);
FASTIFY.server.get('/v2/metrics/sla/all', all);
