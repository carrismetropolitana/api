import redis from 'redis';

export interface RedisClientOptions {
	socket?: {
		connectTimeout?: number
		host?: string
		noDelay?: boolean
		port?: number
		retryStrategy?: (times: number) => number
	}
	url?: string
}

export class RedisService {
	private static _instance: RedisService;
	private readonly client: redis.RedisClientType;

	constructor(options: RedisClientOptions) {
		this.client = redis.createClient({
			...options,
		});
		this.connect();
		this.client.on('error', err => console.log('Redis Client Error', err));
	}

	public static getInstance(options?: RedisClientOptions) {
		if (!RedisService._instance) {
			if (!options) {
				throw new Error('Redis Client Options are required');
			}

			RedisService._instance = new RedisService(options);
		}

		return RedisService._instance;
	}

	async connect() {
		try {
			await this.client.connect();
			console.log(`⤷ Connected to Redis.`);
		}
		catch (error) {
			throw new Error('Error connecting to Redis', error);
		}
	}

	async del(key: string | string[]) {
		return this.client.del(key);
	}

	async disconnect() {
		try {
			await this.client.disconnect();
			console.log(`⤷ Disconnected from Redis.`);
		}
		catch (err) {
			console.log(`⤷ ERROR: Failed to disconnect from Redis.`, err);
		}
	}

	async get(key: string) {
		return this.client.get(key);
	}

	async keys(pattern: string) {
		return this.client.keys(pattern);
	}

	async scanIterator(options: { MATCH: string, TYPE: string }) {
		return this.client.scanIterator(options);
	}

	async set(key: string, value: string) {
		return this.client.set(key, value);
	}
}
