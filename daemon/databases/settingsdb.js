/* * */
/* IMPORTS */
const mongoose = require('mongoose');
const { SETTINGSDB_USER, SETTINGSDB_PASSWORD, SETTINGSDB_HOST, SETTINGSDB_NAME } = process.env;

class SettingsDB {
  constructor() {
    this.connection = mongoose.createConnection(
      `mongodb://${SETTINGSDB_USER}:${SETTINGSDB_PASSWORD}@${SETTINGSDB_HOST}/${SETTINGSDB_NAME}?authSource=admin`
    );
    // this.Route = this.connection.model('Route', require('../schemas/Route'));
  }

  async connect() {
    await this.connection.openUri(
      `mongodb://${SETTINGSDB_USER}:${SETTINGSDB_PASSWORD}@${SETTINGSDB_HOST}/${SETTINGSDB_NAME}?authSource=admin`
    );
    console.log(`⤷ Connected to SettingsDB.`);
  }

  async disconnect() {
    await this.connection.close();
    console.log(`⤷ Disconnected from SettingsDB.`);
  }
}

module.exports = new SettingsDB();
