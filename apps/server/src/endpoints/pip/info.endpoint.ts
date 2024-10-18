/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

const all = async (_, reply) => {
	const allItems = await SERVERDB.get(`${SERVERDB_KEYS.PIP}:all`);
	return reply
		.code(200)
		.send(allItems || []);
};

/* * */

FASTIFY.server.get('/v2/pip', all);
