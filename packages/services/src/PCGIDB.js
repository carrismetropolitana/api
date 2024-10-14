/* * */

import { readFileSync } from 'fs';
import { MongoClient } from 'mongodb';
import { createTunnel } from 'tunnel-ssh';

/* * */

const MAX_CONNECTION_RETRIES = 3;

/* * */

class PCGIDBClass {
	//

	constructor() {
		//
		this.sshTunnelConnecting = false;
		this.sshTunnelConnectionRetries = 0;
		this.sshTunnelConnectionInstance = null;
		//
		this.mongoClientConnecting = false;
		this.mongoClientConnectionRetries = 0;
		this.mongoClientConnectionInstance = null;
		//
	}

	/* * *
	 * CONNECT
	 * This function sets up a MongoDB client instance with the necessary databases and collections.
	 */

	async connect() {
		try {
			console.log('PCGIDB: New connection request...');

			//
			// Establish SSH tunnel

			await this.setupSshTunnel();

			//
			// If another connection request is already in progress, wait for it to complete

			if (this.mongoClientConnecting) {
				console.log('PCGIDB: Waiting for MongoDB Client connection...');
				await this.waitForMongoClientConnection();
				return;
			}

			//
			// Setup the flag to prevent double connection

			this.mongoClientConnecting = true;

			//
			// Setup MongoDB connection options

			const mongoClientOptions = {
				connectTimeoutMS: 5000,
				directConnection: true,
				maxPoolSize: 200,
				minPoolSize: 2,
				readPreference: 'secondaryPreferred',
				serverSelectionTimeoutMS: 5000,
			};

			//
			// Create the client instance

			let mongoClientInstance;

			//
			// Check if there is already an active MongoDB Client connection

			if (this.mongoClientConnectionInstance && this.mongoClientConnectionInstance.topology && this.mongoClientConnectionInstance.topology.isConnected()) {
				mongoClientInstance = this.mongoClientConnectionInstance;
			}
			else if (global._mongoClientConnectionInstance && global._mongoClientConnectionInstance.topology && global._mongoClientConnectionInstance.topology.isConnected()) {
				mongoClientInstance = global._mongoClientConnectionInstance;
			}
			else {
				mongoClientInstance = await MongoClient.connect(process.env.PCGIDB_MONGODB_URI, mongoClientOptions);
			}

			//
			// Setup databases

			const coreManagementDatabase = mongoClientInstance.db('CoreManagement');
			const validationsManagementDatabase = mongoClientInstance.db('ValidationsManagement');

			//
			// Setup collections

			this.VehicleEvents = coreManagementDatabase.collection('VehicleEvents');
			this.ValidationEntity = validationsManagementDatabase.collection('validationEntity');

			//
			// Save the instance in memory

			if (process.env.NODE_ENV === 'development') global._mongoClientConnectionInstance = mongoClientInstance;
			else this.mongoClientConnectionInstance = mongoClientInstance;

			//
			// Reset flags

			this.mongoClientConnecting = false;
			this.mongoClientConnectionRetries = 0;

			//
		}
		catch (error) {
			this.mongoClientConnectionRetries++;
			if (this.mongoClientConnectionRetries < MAX_CONNECTION_RETRIES) {
				console.error(`PCGIDB: Error creating MongoDB Client instance ["${error.message}"]. Retrying (${this.sshTunnelConnectionRetries}/${MAX_CONNECTION_RETRIES})...`);
				await this.reset();
				await this.connect();
			}
			else {
				console.error('PCGIDB: Error creating MongoDB Client instance:', error);
				await this.reset();
			}
		}

		//
	}

	/* * *
	 * SETUP SSH TUNNEL CONNECTION
	 * This function sets up an instance of the SSH Tunnel necessary to connect to MongoDB.
	 */

	async reset() {
		// Close SSH Tunnel connection
		await this.sshTunnelConnectionInstance?.close();
		await global._sshTunnelConnectionInstance?.close();
		// Clear SSH Tunnel flags
		this.sshTunnelConnecting = false;
		this.sshTunnelConnectionInstance = null;
		global._sshTunnelConnectionInstance = null;
		// Close MongoDB connections
		// await this.mongoClientConnectionInstance?.close();
		// await global._mongoClientConnectionInstance?.close();
		// Clear MongoDB flags
		this.mongoClientConnecting = false;
		this.mongoClientConnectionInstance = null;
		global._mongoClientConnectionInstance = null;
		//
		console.log('PCGIDB: Reset all connections.');
	}

	/* * *
	 * RESET CONNECTIONS
	 * Resets all connections and flags
	 */

	async setupSshTunnel() {
		//

		//
		// If another setup request is already in progress, wait for it to complete

		if (this.sshTunnelConnecting) {
			console.log('PCGIDB: Waiting for SSH Tunnel connection...');
			await this.waitForSshTunnelConnection();
			return;
		}

		//
		// Check if there is already an active SSH connection

		if (this.sshTunnelConnectionInstance?.listening || global._sshTunnelConnectionInstance?.listening) {
			console.log('PCGIDB: SSH Tunnel already connected. Skipping...');
			return;
		}

		//
		// Try to close previously active connections

		this.sshTunnelConnectionInstance?.close();
		global._sshTunnelConnectionInstance?.close();

		//
		// Try to setup a new SSH Tunnel

		try {
			//
			console.log('PCGIDB: Starting SSH Tunnel connection...');

			//
			// Setup the flag to prevent double connection

			this.sshTunnelConnecting = true;

			//
			// Setup the SHH Tunnel connection options

			const tunnelOptions = {
				autoClose: true,
			};

			const serverOptions = {
				port: process.env.PCGIDB_TUNNEL_LOCAL_PORT,
			};

			console.log('iughdfuisdfhiudsfhisudhfisudfhusdifuhsdif', process.env.PCGIDB_SSH_HOST)

			const sshOptions = {
				host: process.env.PCGIDB_SSH_HOST,
				port: process.env.PCGIDB_SSH_PORT,
				privateKey: readFileSync(process.env.PCGIDB_SSH_KEY_PATH),
				username: process.env.PCGIDB_SSH_USERNAME,
			};

			const forwardOptions = {
				dstAddr: process.env.PCGIDB_TUNNEL_REMOTE_HOST,
				dstPort: process.env.PCGIDB_TUNNEL_REMOTE_PORT,
				srcAddr: process.env.PCGIDB_TUNNEL_LOCAL_HOST,
				srcPort: process.env.PCGIDB_TUNNEL_LOCAL_PORT,
			};

			//
			// Create the SHH Tunnel connection

			const [server] = await createTunnel(tunnelOptions, serverOptions, sshOptions, forwardOptions);

			console.log(`PCGIDB: Created SSH Tunnel instance on host port ${server.address().port}`);

			if (process.env.NODE_ENV === 'development') global._sshTunnelConnectionInstance = server;
			else this.sshTunnelConnectionInstance = server;

			//
			// Reset flags

			this.sshTunnelConnecting = false;
			this.sshTunnelConnectionRetries = 0;

			//
		}
		catch (error) {
			this.sshTunnelConnectionRetries++;
			if (this.sshTunnelConnectionRetries < MAX_CONNECTION_RETRIES) {
				console.error(`PCGIDB: Error creating SSH Tunnel instance ["${error.message}"]. Retrying (${this.sshTunnelConnectionRetries}/${MAX_CONNECTION_RETRIES})...`);
				await this.reset();
				await this.connect();
			}
			else {
				console.error('PCGIDB: Error creating SSH Tunnel instance:', error);
				await this.reset();
			}
		}

		//
	}

	/* * *
	 * WAIT FOR AUTHENTICATION
	 * Implements a mechanism that waits until authentication is complete
	 */

	async waitForMongoClientConnection() {
		return new Promise((resolve) => {
			const interval = setInterval(() => {
				if (!this.mongoClientConnecting) {
					clearInterval(interval);
					resolve();
				}
			}, 100);
		});
	}

	async waitForSshTunnelConnection() {
		return new Promise((resolve) => {
			const interval = setInterval(() => {
				if (!this.sshTunnelConnecting) {
					clearInterval(interval);
					resolve();
				}
			}, 100);
		});
	}

	//
}

/* * */

export const PCGIDB = new PCGIDBClass();
