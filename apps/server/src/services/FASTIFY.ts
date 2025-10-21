/* * */

import { ApiResponseError } from '@carrismetropolitana/api-types/common';
import cors from '@fastify/cors';
import fastify from 'fastify';

/* * */

const defaultOptions: fastify.FastifyServerOptions = {
	ignoreTrailingSlash: true,
	logger: { level: process.env.NODE_ENV === 'development' ? 'debug' : 'info' },
	requestTimeout: 5000,
};

/* * */

class FastifyService {
	//

	private static _instance: FastifyService;
	public readonly server: fastify.FastifyInstance;

	/**
	 * Create a new instance of the FastifyService.
	 */
	private constructor() {
		this.server = fastify(defaultOptions).withTypeProvider();
		this._setupDefaultHooks();
		this._setupErrorHandler();
		this._setupDefaultRoutes();

		// Only enable CORS in development
		if (process.env.NODE_ENV === 'development') {
			this.server.register(cors, {
				origin: true,
			});
		}

		// this._attemptStart({
		// 	host: process.env.FASTIFY_HOST || '0.0.0.0',
		// 	port: Number(process.env.FASTIFY_PORT) || 5050,
		// });
	}

	/**
	 * Get the singleton instance of the FastifyService.
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
	public GET<RouteGeneric extends fastify.RouteGenericInterface>(path: string, handler: fastify.RouteHandlerMethod<fastify.RawServerBase, fastify.RawRequestDefaultExpression, fastify.RawReplyDefaultExpression, RouteGeneric>, options: fastify.RouteShorthandOptions = {}) {
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
	public POST<RouteGeneric extends fastify.RouteGenericInterface>(path: string, handler: fastify.RouteHandlerMethod<fastify.RawServerBase, fastify.RawRequestDefaultExpression, fastify.RawReplyDefaultExpression, RouteGeneric>, options: fastify.RouteShorthandOptions = {}) {
		this.server.register(() => {
			this.server.post(path, options, handler);
		});
	}

	public start() {
		this._attemptStart({
			host: process.env.FASTIFY_HOST || '0.0.0.0',
			port: Number(process.env.FASTIFY_PORT) || 5050,
		});
	}

	/**
	 * Attempt to start the server.
	 * If the port is already in use, try the next one.
	 * @param options The options to use when starting the server
	 */
	private async _attemptStart(options: fastify.FastifyListenOptions): Promise<void> {
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
	 * Setup the default hooks for the server.
	 */
	private _setupDefaultHooks(): void {
		this.server.addHook('onRequest', async (_, reply) => {
			reply.header('Content-Type', 'application/json; charset=utf-8');
			reply.header('CMET-Receive-Timestamp', Date.now());
		});
		this.server.addHook('onSend', async (_, reply) => {
			reply.header('CMET-Send-Timestamp', Date.now());
		});
	}

	/**
	 * Setup the default routes for the server.
	 */
	private _setupDefaultRoutes(): void {
		this.server.get('/', (_, reply) => {
			reply.send('Jusi was here!');
		});
	}

	/**
	 * Setup the error handler for the server.
	 */
	private _setupErrorHandler(): void {
		this.server.setErrorHandler((error, request, reply) => {
			const response: ApiResponseError = {
				message: `Server Error: "${error.message || 'Unknown Internal Server Error'}"`,
				status: 'error',
				timestamp: Date.now(),
			};
			reply
				.status(500)
				.header('cache-control', 'public, max-age=5')
				.send(response);
		});
	}

	//
}

/* * */

export const FASTIFY = FastifyService.getInstance();
