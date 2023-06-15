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
    // Discover which services this stop is near to
    let nearServices = [];
    if (stop.near_health_clinic) nearServices.push('health_clinic');
    if (stop.near_hospital) nearServices.push('hospital');
    if (stop.near_university) nearServices.push('university');
    if (stop.near_school) nearServices.push('school');
    if (stop.near_police_station) nearServices.push('police_station');
    if (stop.near_fire_station) nearServices.push('fire_station');
    if (stop.near_shopping) nearServices.push('shopping');
    if (stop.near_historic_building) nearServices.push('historic_building');
    if (stop.near_transit_office) nearServices.push('transit_office');
    // Discover which modal connections this stop serves
    let intermodalConnections = [];
    if (stop.subway) intermodalConnections.push('subway');
    if (stop.light_rail) intermodalConnections.push('light_rail');
    if (stop.train) intermodalConnections.push('train');
    if (stop.boat) intermodalConnections.push('boat');
    if (stop.airport) intermodalConnections.push('airport');
    if (stop.bike_sharing) intermodalConnections.push('bike_sharing');
    if (stop.bike_parking) intermodalConnections.push('bike_parking');
    if (stop.car_parking) intermodalConnections.push('car_parking');
    // Initiate a variable to hold the parsed stop
    let parsedStop = {
      code: stop.stop_id,
      name: stop.stop_name,
      short_name: stop.stop_short_name,
      tts_name: stop.tts_stop_name,
      latitude: stop.stop_lat,
      longitude: stop.stop_lon,
      locality: stop.locality,
      parish_id: stop.parish_id,
      parish_name: stop.parish_name,
      municipality_id: stop.municipality_id,
      municipality_name: stop.municipality_name,
      district_id: stop.district_id,
      district_name: stop.district_name,
      region_id: stop.region_id,
      region_name: stop.region_name,
      wheelchair_boarding: stop.wheelchair_boarding,
      near_services: nearServices,
      intermodal_connections: intermodalConnections,
    };
    // Update or create new document
    const updatedStopDocument = await GTFSAPIDB.Stop.findOneAndReplace({ code: parsedStop.code }, parsedStop, { new: true, upsert: true });
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
