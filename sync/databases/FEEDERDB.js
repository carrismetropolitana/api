/* * */
/* IMPORTS */
const pg = require('pg');
const { FEEDERDB_HOST, FEEDERDB_USER, FEEDERDB_PASSWORD } = process.env;

class FEEDERDB {
  constructor() {
    this.connection = new pg.Client({
      host: FEEDERDB_HOST,
      user: FEEDERDB_USER,
      database: FEEDERDB_USER,
      password: FEEDERDB_PASSWORD,
      connectionTimeoutMillis: 10000,
    });
  }
  async connect() {
    this.connection.connect();
    console.log(`⤷ Connected to FEEDERDB.`);
  }
  async disconnect() {
    await this.connection.end();
    console.log(`⤷ Disconnected from FEEDERDB.`);
  }
}

module.exports = new FEEDERDB();
