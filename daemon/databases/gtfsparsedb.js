/* * */
/* IMPORTS */
const pg = require('pg');
const { GTFSPARSEDB_HOST, GTFSPARSEDB_USER, GTFSPARSEDB_PASSWORD } = process.env;

class GTFSParseDB {
  async connect() {
    this.connection = new pg.Client({
      host: GTFSPARSEDB_HOST,
      user: GTFSPARSEDB_USER,
      database: GTFSPARSEDB_USER,
      password: GTFSPARSEDB_PASSWORD,
    });
    this.connection.connect();
    console.log(`⤷ Connected to GTFSParseDB.`);
  }
  async disconnect() {
    await this.connection.end();
    console.log(`⤷ Disconnected from GTFSParseDB.`);
  }
}

module.exports = new GTFSParseDB();
