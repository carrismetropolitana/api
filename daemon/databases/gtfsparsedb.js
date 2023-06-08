/* * */
/* IMPORTS */
const mysql = require('mysql2/promise');
const pg = require('pg');
const { GTFSPARSEDB_HOST, GTFSPARSEDB_USER, GTFSPARSEDB_PASSWORD, GTFSPARSEDB_NAME } = process.env;

class GTFSParseDB {
  async connect() {
    this.connection = new pg.Client({
      password: GTFSPARSEDB_PASSWORD,
      host: GTFSPARSEDB_HOST,
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
