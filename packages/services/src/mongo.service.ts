import { Collection, Db, DbOptions, MongoClient, MongoClientOptions } from 'mongodb';

export class MongoDbService {
	private static _instance: MongoDbService;
	private _client: MongoClient;

	constructor(uri: string, options?: MongoClientOptions) {
		this._client = new MongoClient(uri, options);

		this._client.on('close', () => {
			console.warn('MongoDB connection closed unexpectedly.');
		});
		this._client.on('reconnect', () => {
			console.log('MongoDB reconnected.');
		});
	}

	/**
   * Get the singleton instance of MongoDbService.
   */
	public static getInstance(uri?: string, options?: MongoClientOptions): MongoDbService {
		if (!MongoDbService._instance) {
			if (!uri) {
				throw new Error('MongoDB URI is required');
			}

			MongoDbService._instance = new MongoDbService(uri, options);
		}

		return MongoDbService._instance;
	}

	/**
     * Connect to MongoDB and return the database instance.
     */
	async connect(): Promise<MongoClient> {
		if (!this._client || !this._client) {
			try {
				await this._client.connect();
				console.log('⤷ Connected to MongoDB.');
			}
			catch (error) {
				throw new Error('Error connecting to MongoDB', { cause: error });
			}
		}
		return this._client;
	}

	/**
     * Create a new Db instance sharing the current socket connections.
     *
     * @param dbName - The name of the database we want to use. If not provided, use database name from connection string.
     * @param options - Optional settings for Db construction
     */
	db(dbName?: string, options?: DbOptions): Db {
		return this._client.db(dbName, options);
	}

	/**
   * Close the MongoDB connection.
   */
	async disconnect(): Promise<void> {
		if (this._client) {
			await this._client.close();
			console.log('⤷ Disconnected from MongoDB.');
		}
	}

	/**
     * Get a specific collection by name.
     * @param db - The database instance.
     * @param collectionName - The name of the collection to retrieve.
     * @returns The collection instance.
     */
	async getCollection<T>(db: Db, collectionName: string): Promise<Collection<T>> {
		return db.collection<T>(collectionName);
	}

	get client(): MongoClient {
		return this._client;
	}
}
