/* * */

const pg = require('pg');
const { NETWORKDB_HOST, NETWORKDB_USER, NETWORKDB_PASSWORD } = process.env;

/* * */

class NETWORKDB {
  constructor() {
    this.connection = new pg.Client({
      host: NETWORKDB_HOST,
      user: NETWORKDB_USER,
      database: NETWORKDB_USER,
      password: NETWORKDB_PASSWORD,
      connectionTimeoutMillis: 10000,
    });
  }
  async connect() {
    this.connection.connect();
    console.log(`⤷ Connected to NETWORKDB.`);
  }
  async disconnect() {
    await this.connection.end();
    console.log(`⤷ Disconnected from NETWORKDB.`);
  }
}

/* * */

module.exports = new NETWORKDB();
