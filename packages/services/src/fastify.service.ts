/* * */

import fastify, {
	FastifyInstance,
	FastifyListenOptions,
	FastifyServerOptions,
} from 'fastify';

/* * */

class FastifyService {
	private static _instance: FastifyService;
	public readonly server: FastifyInstance;

	private constructor(options: FastifyServerOptions) {
		this.server = fastify(options).withTypeProvider();
		this._setupDefaultHooks();
		this._setupDefaultRoutes();
		this.start();
	}

	public static getInstance(options: FastifyServerOptions = {}): FastifyService {
		if (!FastifyService._instance) {
			FastifyService._instance = new FastifyService(options);
		}
		return FastifyService._instance;
	}

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

	private _handleStartError(error: Error): void {
		this.server.log.error({ error, message: 'Error starting server' });
		process.exit(1);
	}

	private _setupDefaultHooks(): void {
		this.server.addHook('onSend', async (request, reply, payload) => {
			// Check if Content-Type is already set for local override
			if (!reply.hasHeader('Content-Type')) {
				reply.header('Content-Type', 'application/json; charset=utf-8');
			}
			return payload;
		});
	}

	private _setupDefaultRoutes(): void {
		this.server.get('/', (req, res) => {
			res.send('Jusi was here!');
		});
	}

	public async start(): Promise<void> {
		const port = Number(process.env.FASTIFY_PORT) || 5050;
		const options: FastifyListenOptions = {
			host: process.env.FASTIFY_HOST || '0.0.0.0',
			port,
		};

		await this._attemptStart(options);
	}

	public async stop(): Promise<void> {
		try {
			await this.server.close();
		}
		catch (error) {
			this.server.log.error(error);
			process.exit(1);
		}
	}
}

export default FastifyService;
