/* * */

import SERVERDB from '@/services/SERVERDB.js';
import fastify, { RouteHandlerMethod, RouteShorthandOptions } from 'fastify';

/* * */

class FASTIFY {
	//

	server: fastify.FastifyInstance;

	constructor() {
		this.server = fastify({ logger: true, requestTimeout: 10000 });
		this._registerOpenApiPlugin();
		this._setupDocsRoute();
		this.server.listen({ host: '0.0.0.0', port: 5050 }, async (err, address) => {
			if (err) throw err;
			console.log(`Fastify server listening on ${address}`);
			await SERVERDB.connect();
		})
	}

	private async _registerOpenApiPlugin(): Promise<void> {
		console.log('Registering OpenAPI plugin');
		await this.server.register(import('@fastify/swagger'), {
			openapi: {
			  openapi: '3.0.3',
			  info: {
				title: 'Carris Metropolitana API',
				description: 'Documentation for the Carris Metropolitana API',
				version: 'v2'
			  },
			  servers: [
				{
				  url: 'https://api.carrismetropolitana.pt/v2',
				  description: 'Production'
				}
			  ],
			  tags: [
				{ name: 'datasets', description: 'Datasets' },
				{ name: 'metrics', description: 'Bus network operation real-time metrics' },
				{ name: 'network', description: 'Bus network entities' },
				{ name: 'status', description: 'System status info' },
			  ],
			  externalDocs: {
				url: 'https://docs.carrismetropolitana.pt',
				description: 'More detailed documentation here'
			  }
			},
			hideUntagged: true,
		});

		// not needed because of the _setupDocsRoute method
		await this.server.register(import('@fastify/swagger-ui'), {
			routePrefix: '/v2/docs-ui',
		});
	}

	private _setupDocsRoute(): void {
		this.server.get('/v2/documentation', async (_, reply) => {
			return this.server.swagger();
		});
	}

	registerRoutePlugin(
		method: 'GET' | 'POST',
		path: string,
		handler: RouteHandlerMethod,
		opts: RouteShorthandOptions = {},
	): void {
		this.server.register(() => {
			this.server[method.toLowerCase()](path, opts, handler);
		});
	}

	//
}

export default new FASTIFY();
