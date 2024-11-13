/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

FASTIFY.server.get('/metrics/demand/by_day', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_DAY);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/metrics/demand/by_month', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_MONTH);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/metrics/demand/by_line', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_LINE);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/metrics/demand/by_stop', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_STOP);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/metrics/demand/by_operator/:operatorId/:day', async (request, reply) => {
	const { day, operatorId } = request.params as { day: string, operatorId: string };

	let metric = [];
	if (operatorId === 'cm') {
		const operators = ['41', '42', '43', '44'];
		metric = [];

		for (const operator of operators) {
			const operation = await SERVERDB.get(`${SERVERDB_KEYS.METRICS.DEMAND.BY_OPERATOR}:${operator}:${day}`);

			if (!operation) {
				continue;
			}

			metric.push({
				...JSON.parse(operation),
				operator_id: operator,
			});
		}
	}
	else {
		const operation = await SERVERDB.get(`${SERVERDB_KEYS.METRICS.DEMAND.BY_OPERATOR}:${operatorId}:${day}`);
		metric = {
			...JSON.parse(operation),
			operator_id: operatorId,
		};
	}

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
});

/* * */

FASTIFY.server.get('/metrics/service/all', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.SERVICE);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});
