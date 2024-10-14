import redis from 'redis';

export interface RedisClientOptions {
    url?: string;
    socket?: {
        host?: string;
        port?: number;
        connectTimeout?: number;
        retryStrategy?: (times: number) => number;
        noDelay?: boolean;
    };
}

export default class RedisService {
    private static _instance: RedisService;
    private readonly client: redis.RedisClientType;

    constructor(options: RedisClientOptions) {
        this.client = redis.createClient({
           ...options
        });
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
        } catch (error: any) {
            throw new Error('Error connecting to Redis');
        }
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

    async set(key: string, value: string) {
        return this.client.set(key, value);
    }

    async get(key: string) {
        return this.client.get(key);
    }

    async del(key: string | string[]) {
        return this.client.del(key);
    }

    async keys(pattern: string) {
        return this.client.keys(pattern);
    }
}