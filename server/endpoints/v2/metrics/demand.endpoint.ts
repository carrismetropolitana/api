/* * */

import FASTIFY from '@/services/FASTIFY.js';
import SERVERDB from '@/services/SERVERDB.js';
import { LineMetrics } from '@/types/line-metrics.js';
import { StopMetrics } from '@/types/stop-metrics.js';

/* * */

const byDay = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2/metrics/demand/by_day');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const byLine = async (_, reply) => {
	const allItems = await SERVERDB.client.get('v2/metrics/demand/by_line');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const byLineId = async (request, reply) => {
	const allItems = await SERVERDB.client.get(`v2/metrics/demand/by_line`);

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
	const allItems = await SERVERDB.client.get('v2/metrics/demand/by_stop');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

const byStopId = async (request, reply) => {
	const allItems = await SERVERDB.client.get(`v2/metrics/demand/by_stop`);

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

/* * */

FASTIFY.server.get('/metrics/demand/by_day', byDay);
FASTIFY.server.get('/metrics/demand/by_line', byLine);
FASTIFY.server.get('/metrics/demand/by_line/:lineId', byLineId);
FASTIFY.server.get('/metrics/demand/by_stop', byStop);
FASTIFY.server.get('/metrics/demand/by_stop/:stopId', byStopId);

FASTIFY.server.get('/v2/metrics/demand/by_day', byDay);
FASTIFY.server.get('/v2/metrics/demand/by_line', byLine);
FASTIFY.server.get('/v2/metrics/demand/by_line/:lineId', byLineId);
FASTIFY.server.get('/v2/metrics/demand/by_stop', byStop);
FASTIFY.server.get('/v2/metrics/demand/by_stop/:stopId', byStopId);
