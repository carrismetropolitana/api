/* * */
/* IMPORTS */
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');

/**
 * UPDATE STOPS
 * Query 'stops' table to get all unique stops.
 * Save each result in MongoDB.
 * @async
 */
module.exports = async () => {
  // Record the start time to later calculate operation duration
  console.log(`⤷ Updating Stops...`);
  const startTime = process.hrtime();
  // Query Postgres for all unique stops by stop_id
  const allStops = await GTFSParseDB.connection.query('SELECT * FROM stops');
  // Initate a temporary variable to hold updated Stops
  let updatedStopIds = [];
  // For each stop, update its entry in the database
  for (const stop of allStops.rows) {
    // Initiate a variable to hold the parsed stop
    let parsedStop = {
      // Save all properties with the same key
      ...stop,
      // Save properties with different key
      code: stop.stop_id,
      name: stop.stop_name,
      short_name: stop.stop_short_name,
      tts_name: stop.tts_stop_name,
      latitude: stop.stop_lat,
      longitude: stop.stop_lon,
      municipality_code: stop.municipality,
    };
    // Update or create new document
    const updatedStopDocument = await GTFSAPIDB.Stop.findOneAndUpdate({ code: parsedStop.code }, parsedStop, { new: true, upsert: true });
    updatedStopIds.push(updatedStopDocument._id);
  }
  // Log count of updated Stops
  console.log(`⤷ Updated ${updatedStopIds.length} Stops.`);
  // Delete all Stops not present in the current update
  const deletedStaleStops = await GTFSAPIDB.Stop.deleteMany({ _id: { $nin: updatedStopIds } });
  console.log(`⤷ Deleted ${deletedStaleStops.deletedCount} stale Stops.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Stops (${elapsedTime}).`);
  //
};
