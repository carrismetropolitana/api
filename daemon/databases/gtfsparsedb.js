/* * */
/* IMPORTS */
const mysql = require('mysql2/promise');
const { GTFSPARSEDB_HOST, GTFSPARSEDB_USER, GTFSPARSEDB_PASSWORD, GTFSPARSEDB_NAME } = process.env;

class GTFSParseDB {
  async connect() {
    this.connection = await mysql.createConnection({
      host: GTFSPARSEDB_HOST,
      user: GTFSPARSEDB_USER,
      password: GTFSPARSEDB_PASSWORD,
      database: GTFSPARSEDB_NAME,
    });
    console.log(`⤷ Connected to GTFSParseDB.`);
  }
  async disconnect() {
    await this.connection.end();
    console.log(`⤷ Disconnected from GTFSParseDB.`);
  }
}

module.exports = new GTFSParseDB();
