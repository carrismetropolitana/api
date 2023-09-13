/* * */
/* IMPORTS */
const redis = require('redis');
const { SERVERDB_HOST } = process.env;

class SERVERDB {
  constructor() {
    this.client = redis.createClient({ socket: { host: SERVERDB_HOST } });
    this.client.on('error', (err) => console.log('Redis Client Error', err));
  }

  async connect() {
    try {
      console.log('SERVERDB_HOST', SERVERDB_HOST);
      await this.client.connect();
      console.log(`⤷ Connected to SERVERDB.`);
    } catch (err) {
      console.log(`⤷ ERROR: Failed to connect to SERVERDB.`, err);
    }
  }

  async disconnect() {
    try {
      await this.client.disconnect();
      console.log(`⤷ Disconnected from SERVERDB.`);
    } catch (err) {
      console.log(`⤷ ERROR: Failed to disconnect from SERVERDB.`, err);
    }
  }
}

module.exports = new SERVERDB();
