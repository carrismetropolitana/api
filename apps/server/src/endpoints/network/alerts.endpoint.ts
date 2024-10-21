/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import path from 'path';
import protobufjs from 'protobufjs';
import { fileURLToPath } from 'url';

/* * */

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const gtfsRealtime = protobufjs.loadSync(
	path.resolve(__dirname, '../../assets/gtfs-realtime.proto'),
);

/* * */

FASTIFY.server.get('/alerts', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.ALERTS.ALL);
	if (!allItemsTxt) return reply.code(404).send([]);
	return reply.code(200).send(allItemsTxt);
});

FASTIFY.server.get('/alerts.pb', async (_, reply) => {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.ALERTS.PROTOBUF);
	const allItemsData = JSON.parse(allItemsTxt);
	const FeedMessage = gtfsRealtime.root.lookupType('transit_realtime.FeedMessage');
	const message = FeedMessage.fromObject(allItemsData);
	const buffer = FeedMessage.encode(message).finish();
	return reply.type('application/octet-stream').send(buffer);
});
