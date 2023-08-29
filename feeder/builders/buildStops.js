const FEEDERDB = require('../services/FEEDERDB');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');

/* UPDATE STOPS */

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Query Postgres for all unique stops by stop_id
  console.log(`⤷ Querying database...`);
  const allStops = await FEEDERDB.connection.query(`
    SELECT
        s.*,
        r.route_ids,
        r.line_ids,
        r.pattern_ids
    FROM
        stops s
    LEFT JOIN (
        SELECT
            stop_id,
            json_agg(DISTINCT r.route_short_name) AS line_ids,
            json_agg(DISTINCT r.route_id) AS route_ids,
            json_agg(DISTINCT t.pattern_id) AS pattern_ids
        FROM
            stop_times st
        JOIN
            trips t ON st.trip_id = t.trip_id
        JOIN
            routes r ON t.route_id = r.route_id
        GROUP BY
            stop_id
    ) r ON s.stop_id = r.stop_id;
  `);
  // Log progress
  console.log(`⤷ Updating Stops...`);
  // Initate a temporary variable to hold updated Stops
  let updatedStopCodes = [];
  // For each stop, update its entry in the database
  for (const stop of allStops.rows) {
    // Discover which facilities this stop is near to
    const facilities = [];
    if (stop.near_health_clinic) facilities.push('health_clinic');
    if (stop.near_hospital) facilities.push('hospital');
    if (stop.near_university) facilities.push('university');
    if (stop.near_school) facilities.push('school');
    if (stop.near_police_station) facilities.push('police_station');
    if (stop.near_fire_station) facilities.push('fire_station');
    if (stop.near_shopping) facilities.push('shopping');
    if (stop.near_historic_building) facilities.push('historic_building');
    if (stop.near_transit_office) facilities.push('transit_office');
    if (stop.subway) facilities.push('subway');
    if (stop.light_rail) facilities.push('light_rail');
    if (stop.train) facilities.push('train');
    if (stop.boat) facilities.push('boat');
    if (stop.airport) facilities.push('airport');
    if (stop.bike_sharing) facilities.push('bike_sharing');
    if (stop.bike_parking) facilities.push('bike_parking');
    if (stop.car_parking) facilities.push('car_parking');
    // Initiate a variable to hold the parsed stop
    let parsedStop = {
      code: stop.stop_id,
      name: stop.stop_name,
      short_name: stop.stop_short_name,
      tts_name: stop.tts_stop_name,
      lat: stop.stop_lat,
      lon: stop.stop_lon,
      locality: stop.locality,
      parish_code: stop.parish_id,
      parish_name: stop.parish_name,
      municipality_code: stop.municipality_id,
      municipality_name: stop.municipality_name,
      district_code: stop.district_id,
      district_name: stop.district_name,
      region_code: stop.region_id,
      region_name: stop.region_name,
      wheelchair_boarding: stop.wheelchair_boarding,
      facilities: facilities,
      lines: stop.line_ids,
      routes: stop.route_ids,
      patterns: stop.pattern_ids,
    };
    // Update or create new document
    await SERVERDB.Stop.replaceOne({ code: parsedStop.code }, parsedStop, { upsert: true });
    updatedStopCodes.push(parsedStop.code);
  }
  // Log count of updated Stops
  console.log(`⤷ Updated ${updatedStopCodes.length} Stops.`);
  // Delete all Stops not present in the current update
  const deletedStaleStops = await SERVERDB.Stop.deleteMany({ code: { $nin: updatedStopCodes } });
  console.log(`⤷ Deleted ${deletedStaleStops.deletedCount} stale Stops.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Stops (${elapsedTime}).`);
  //
};
