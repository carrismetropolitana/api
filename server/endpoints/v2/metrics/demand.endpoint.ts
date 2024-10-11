/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';
import { LineMetrics, OperatorMetrics, StopMetrics } from '@/types/metrics.types.js';

/* * */

const byDay = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:metrics:demand:by_day');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const byMonth = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:metrics:demand:by_month');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const byLine = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:metrics:demand:by_line');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const byLineId = async (request, reply) => {
	const allItems = await SERVERDB.client.get(`v2:metrics:demand:by_line`);

	const lineId = request.params.lineId;
	const line = JSON.parse(allItems).find((item: LineMetrics) => item.line_id === lineId);

	if (!line) {
		return reply
			.code(404)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ message: 'Not found' });
	}

	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(line);
};

const byStop = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2:metrics:demand:by_stop');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const byStopId = async (request, reply) => {
	const allItems = await SERVERDB.client.get(`v2:metrics:demand:by_stop`);

	const stopId = request.params.stopId;
	const stop = JSON.parse(allItems).find((item: StopMetrics) => item.stop_id === stopId);

	if (!stop) {
		return reply
			.code(404)
			.header('Content-Type', 'application/json; charset=utf-8')
			.send({ message: 'Not found' });
	}

	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(stop);
};

const byOperator = async (request, reply) => {
	const operatorId = request.params.operator_id;
	const date = request.params.date;

	let metric: OperatorMetrics | OperatorMetrics[];
	if (operatorId === 'cm') {
		const operators = ['41', '42', '43', '44'];
		metric = [];

		for (const operator of operators) {
			const operation = await SERVERDB.client.get(`v2:metrics:demand:operator:${operator}:${date}`);

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
		const operation = await SERVERDB.client.get(`v2:metrics:demand:operator:${operatorId}:${date}`);
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
};

/* * */

FASTIFY.server.get('/metrics/demand/by_day', byDay);
FASTIFY.server.get('/metrics/demand/by_month', byMonth);
FASTIFY.server.get('/metrics/demand/by_line', byLine);
FASTIFY.server.get('/metrics/demand/by_line/:lineId', byLineId);
FASTIFY.server.get('/metrics/demand/by_stop', byStop);
FASTIFY.server.get('/metrics/demand/by_stop/:stopId', byStopId);
FASTIFY.server.get('/metrics/demand/operator/:operator_id/:date', byOperator);

FASTIFY.server.get('/v2/metrics/demand/by_day', byDay);
FASTIFY.server.get('/v2/metrics/demand/by_month', byMonth);
FASTIFY.server.get('/v2/metrics/demand/by_line', byLine);
FASTIFY.server.get('/v2/metrics/demand/by_line/:lineId', byLineId);
FASTIFY.server.get('/v2/metrics/demand/by_stop', byStop);
FASTIFY.server.get('/v2/metrics/demand/by_stop/:stopId', byStopId);
FASTIFY.server.get('/v2/metrics/demand/operator/:operator_id/:date', byOperator);
