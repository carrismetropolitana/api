/* eslint-disable @typescript-eslint/no-explicit-any */
/* * */

import { SERVERDB } from '@carrismetropolitana/api-services';
import fastify from 'fastify';

/* * */

class FASTIFY {
	//

	server: fastify.FastifyInstance;

	constructor() {
		this.server = fastify({ logger: true, requestTimeout: 10000 });
		const startServer = (port: number) => {
			this.server.listen({ host: '0.0.0.0', port }, async (err: any, address: any) => {
				if (err) {
					if (err.code === 'EADDRINUSE') {
						console.log(`Port ${port} is in use, trying another port...`);
						startServer(port + 1);
					}
					else {
						throw err;
					}
				}
				else {
					console.log(`Fastify server listening on ${address}`);
					await SERVERDB.connect();
				}
			});
		};

		startServer(5050);
	}

	//
}

export default new FASTIFY();
