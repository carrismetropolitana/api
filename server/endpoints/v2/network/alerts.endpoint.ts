/* * */

import FASTIFY from '@/services/FASTIFY.js';
import protobufjs from 'protobufjs';

/* * */

const gtfsRealtime = protobufjs.loadSync(`${process.env.PWD}/services/gtfs-realtime.proto`);

/* * */

const json = async (_, reply) => {
	const allAlertsResponse = await fetch('https://www.carrismetropolitana.pt/?api=alerts-v2');
	const allAlerts = await allAlertsResponse.json();
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allAlerts || []);
};

/* * */

const protobuf = async (_, reply) => {
	const allAlertsResponse = await fetch('https://www.carrismetropolitana.pt/?api=alerts-v2');
	const allAlerts = await allAlertsResponse.json();
	const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
	const message = FeedMessage.fromObject(allAlerts);
	const buffer = FeedMessage.encode(message).finish();
	return reply.send(buffer);
};

/* * */

FASTIFY.server.get('/alerts', json);
FASTIFY.server.get('/alerts.pb', protobuf);

FASTIFY.server.get('/v1/alerts', json);
FASTIFY.server.get('/v1/alerts.pb', protobuf);

FASTIFY.server.get('/v2/alerts', json);
FASTIFY.server.get('/v2/alerts.pb', protobuf);
