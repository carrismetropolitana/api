/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import path from 'path';
import protobufjs from 'protobufjs';
import { fileURLToPath } from 'url';

/* * */

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

// Now load the file directly from dist
const gtfsRealtime = protobufjs.loadSync(
	path.resolve(__dirname, '../../../assets/gtfs-realtime.proto'),
);

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
