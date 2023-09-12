/* * */
/* IMPORTS */
const mongoose = require('mongoose');
const { SERVERDB_USER, SERVERDB_PASSWORD, SERVERDB_HOST, SERVERDB_NAME } = process.env;

class SERVERDB {
  constructor() {
    this.connection = mongoose.createConnection(`mongodb://${SERVERDB_USER}:${SERVERDB_PASSWORD}@${SERVERDB_HOST}/${SERVERDB_NAME}?authSource=admin`);
    // GTFS
    this.Line = this.connection.model('Line', require('../schemas/Line'));
    this.Municipality = this.connection.model('Municipality', require('../schemas/Municipality'));
    this.Pattern = this.connection.model('Pattern', require('../schemas/Pattern'));
    this.Shape = this.connection.model('Shape', require('../schemas/Shape'));
    this.Stop = this.connection.model('Stop', require('../schemas/Stop'));
    // DATASETS
    this.School = this.connection.model('School', require('../schemas/School'));
    this.Encm = this.connection.model('Encm', require('../schemas/Encm'));
  }

  async connect() {
    try {
      await this.connection.openUri(`mongodb://${SERVERDB_USER}:${SERVERDB_PASSWORD}@${SERVERDB_HOST}/${SERVERDB_NAME}?authSource=admin`);
      console.log(`⤷ Connected to SERVERDB.`);
    } catch (err) {
      console.log(`⤷X Failed to connect to SERVERDB.`, err);
    }
  }

  async disconnect() {
    try {
      await this.connection.close();
      console.log(`⤷ Disconnected from SERVERDB.`);
    } catch (err) {
      console.log(`⤷X Failed to disconnect from SERVERDB.`, err);
    }
  }
}

module.exports = new SERVERDB();
