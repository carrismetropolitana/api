/* * */

import fastifySwagger from '@fastify/swagger';
import fastify, { FastifyInstance, FastifyListenOptions, FastifyServerOptions, RouteHandlerMethod, RouteShorthandOptions } from 'fastify';

/* * */

const defaultOptions: FastifyServerOptions = {
	ignoreTrailingSlash: true,
	logger: {
		level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
		transport: { options: { colorize: true }, target: 'pino-pretty' },
	},
	requestTimeout: 5000,
};

/* * */

class FastifyService {
	//

	private static _instance: FastifyService;
	public readonly server: FastifyInstance;

	/**
	 * Create a new instance of the FastifyService.
	 * @param options The options to use when creating the instance.
	 */
	private constructor() {
		this.server = fastify(defaultOptions).withTypeProvider();
		this._registerOpenApiPlugin();
		this._setupDefaultHooks();
		this._setupDefaultRoutes();
		this._attemptStart({
			host: process.env.FASTIFY_HOST || '0.0.0.0',
			port: Number(process.env.FASTIFY_PORT) || 5050,
		});
	}

	/**
	 * Get the singleton instance of the FastifyService.
	 * @param options The options to use when creating the instance.
	 * @returns The singleton instance of the FastifyService.
	 */
	public static getInstance(): FastifyService {
		if (!FastifyService._instance) {
			FastifyService._instance = new FastifyService();
		}
		return FastifyService._instance;
	}

	/**
	 * Register a GET route pre-configured with the OpenAPI plugin.
	 * @param path The path of the route.
	 * @param handler The handler for the route.
	 * @param options The options for the route.
	 */
	public GET(path: string, handler: RouteHandlerMethod, options: RouteShorthandOptions = {}) {
		this.server.register(() => {
			this.server.get(path, options, handler);
		});
	}

	/**
	 * Register a POST route pre-configured with the OpenAPI plugin.
	 * @param path The path of the route.
	 * @param handler The handler for the route.
	 * @param options The options for the route.
	 */
	public POST(path: string, handler: RouteHandlerMethod, options: RouteShorthandOptions = {}) {
		this.server.register(() => {
			this.server.post(path, options, handler);
		});
	}

	/**
	 * Attempt to start the server.
	 * If the port is already in use, try the next one.
	 * @param options The options to use when starting the server
	 */
	private async _attemptStart(options: FastifyListenOptions): Promise<void> {
		try {
			await this.server.listen(options);
		}
		catch (error) {
			if (error.code === 'EADDRINUSE') {
				this.server.log.warn(`Port ${options.port} in use, trying port ${++options.port}`);
				await this._attemptStart(options);
			}
			else {
				this._handleStartError(error);
			}
		}
	}

	/**
	 * Handle the error that occurred when starting the server.
	 * @param error The error that occurred
	 */
	private _handleStartError(error: Error): void {
		this.server.log.error({ error, message: 'Error starting server' });
		process.exit(1);
	}

	/**
	 * Register the OpenAPI plugin and setup the default routes.
	 */
	private async _registerOpenApiPlugin(): Promise<void> {
		console.log('Registering OpenAPI plugin');
		await this.server.register(fastifySwagger, {
			hideUntagged: true,
			openapi: {
				externalDocs: {
					description: 'More detailed documentation here',
					url: 'https://docs.carrismetropolitana.pt',
				},
				info: {
					description: 'Documentation for the Carris Metropolitana API',
					title: 'Carris Metropolitana API',
					version: 'v2',
				},
				openapi: '3.0.3',
				servers: [
					{
						description: 'Production',
						url: 'https://api.carrismetropolitana.pt/v2',
					},
				],
				tags: [
					{ description: 'Datasets', name: 'datasets' },
					{ description: 'Bus network operation real-time metrics', name: 'metrics' },
					{ description: 'Bus network entities', name: 'network' },
					{ description: 'System status info', name: 'status' },
				],
			},
		});
	}

	/**
	 * Setup the default hooks for the server.
	 */
	private _setupDefaultHooks(): void {
		// Add Content-Type header to all responses by default
		this.server.addHook('onRequest', async (_, reply) => {
			reply.header('Content-Type', 'application/json; charset=utf-8');
		});
	}

	/**
	 * Setup the default routes for the server.
	 */
	private _setupDefaultRoutes(): void {
		this.server.get('/', (_, reply) => {
			reply.send('Jusi was here!');
		});
		this.server.get('/documentation', async () => {
			return this.server.swagger();
		});
	}

	//
}

/* * */

export const FASTIFY = FastifyService.getInstance();
