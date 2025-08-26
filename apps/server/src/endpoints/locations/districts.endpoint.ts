/* * */

import { FASTIFY } from '@/services/FASTIFY.js';
import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { ApiResponse } from '@carrismetropolitana/api-types/common';
import { District } from '@carrismetropolitana/api-types/locations';
import { type FastifyReply, type FastifyRequest } from 'fastify';

/* * */

const handler = async (_: FastifyRequest, reply: FastifyReply) => {
	//

	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.LOCATIONS.DISTRICTS) as string;

	const response: ApiResponse<District[]> = {
		data: JSON.parse(allItemsTxt) || [],
		status: 'success',
		timestamp: Date.now(),
	};

	return reply
		.code(200)
		.header('cache-control', 'public, max-age=3600')
		.send(JSON.stringify(response));
};

/* * */

FASTIFY.GET('/locations/districts', handler);
