/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import fastify, { FastifyInstance } from 'fastify';

/* * */

class FASTIFYClass {
	//

	server: FastifyInstance;

	constructor() {
		this.server = fastify({ logger: true, requestTimeout: 10000 });
		this.server.listen({ host: '0.0.0.0', port: 5050 }, async (err, address) => {
			if (err) throw err;
			console.log(`Fastify server listening on ${address}`);
			await SERVERDB.connect();
		});
	}

	//
}

export const FASTIFY = new FASTIFYClass();