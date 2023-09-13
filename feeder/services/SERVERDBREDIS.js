/* * */
/* IMPORTS */
const redis = require('redis');
const { SERVERDBREDIS_HOST } = process.env;

class SERVERDBREDIS {
  constructor() {
    console.log('SERVERDBREDIS_HOST', SERVERDBREDIS_HOST);
    this.client = redis.createClient({ socket: { host: SERVERDBREDIS_HOST } });
    this.client.on('error', (err) => console.log('Redis Client Error', err));
  }

  async connect() {
    try {
      await this.client.connect();
      console.log(`⤷ Connected to SERVERDBREDIS.`);
    } catch (err) {
      console.log(`⤷ ERROR: Failed to connect to SERVERDBREDIS.`, err);
    }
  }

  async disconnect() {
    try {
      await this.client.disconnect();
      console.log(`⤷ Disconnected from SERVERDBREDIS.`);
    } catch (err) {
      console.log(`⤷ ERROR: Failed to disconnect from SERVERDBREDIS.`, err);
    }
  }
}

module.exports = new SERVERDBREDIS();
