/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
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
	const allItems = await SERVERDB.get('v2:network:alerts:json');
	return reply
		.code(200)
		.header('Content-Type', 'application/json; charset=utf-8')
		.send(allItems || []);
};

/* * */

const protobuf = async (_, reply) => {
	const allItems = await SERVERDB.get('v2:network:alerts:protobuf');
	const allAlerts = JSON.parse(allItems);
	const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
	const message = FeedMessage.fromObject(allAlerts);
	const buffer = FeedMessage.encode(message).finish();
	return reply.send(buffer);
};

/* * */

FASTIFY.server.get('/v2/alerts', json);
FASTIFY.server.get('/v2/alerts.pb', protobuf);
