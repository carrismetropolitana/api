/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';

/* * */

interface RequestSchema {
	Params: {
		id: string
	}
}

/* * */

FASTIFY.server.get<RequestSchema>('/patterns/:id', async (request, reply) => {
	const singleItemTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.PATTERNS.ID(request.params.id));
	if (!singleItemTxt) return reply.code(404).send({});
	return reply.code(200).send(singleItemTxt);
});
