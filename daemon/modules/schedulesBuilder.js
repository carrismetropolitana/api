/* * */
/* IMPORTS */
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');
const turf = require('@turf/helpers');

//
//
//

/**
 * Retrieve the dates matching the provided service_id
 * @async
 * @param {String} service_id The service_id to retrieve
 * @returns {Array} Array of date strings
 */
async function getTripDates(service_id) {
  // Get dates in the YYYYMMDD format (GTFS Standard format)
  const allDates = await GTFSParseDB.connection.query(`SELECT date FROM calendar_dates WHERE service_id = '${service_id}'`);
  return allDates.rows.map((item) => item.date);
}

//
//
//

/**
 * Calculate time difference
 * @async
 * @param {String} service_id The service_id to retrieve
 * @returns {Array} Array of date strings
 */
function calculateTimeDifference(time1, time2) {
  // Handle the case where time1 is zero
  if (!time1) return 0;
  // Convert time strings to seconds
  const [h1, m1, s1] = time1.split(':').map(Number);
  const [h2, m2, s2] = time2.split(':').map(Number);
  let totalSeconds1 = h1 * 3600 + m1 * 60 + s1;
  let totalSeconds2 = h2 * 3600 + m2 * 60 + s2;

  // Take modulus of total seconds to handle cases exceeding 24 hours
  totalSeconds1 %= 86400;
  totalSeconds2 %= 86400;

  // Calculate time difference
  let timeDifference = totalSeconds2 - totalSeconds1;

  // Handle negative time difference
  if (timeDifference < 0) {
    timeDifference += 86400;
  }

  // Convert time difference back to "HH:MM:SS" format
  const hours = Math.floor(timeDifference / 3600);
  const minutes = Math.floor((timeDifference % 3600) / 60);
  const seconds = timeDifference % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

//
//
//

/**
 * Retrieve stops for the given trip_id
 * @async
 * @param {String} trip_id The trip_id to retrieve from stop_times
 * @returns {Array} Array of stops objects
 */
async function getTripSchedule(trip_id) {
  // Get path for trip from database
  const allStopTimes = await GTFSParseDB.connection.query(`SELECT * FROM stop_times WHERE trip_id = '${trip_id}' ORDER BY stop_sequence`);
  // Setup temp result variable
  let formattedSchedule = [];
  // Initiate variables to keep track of distance and travel duration
  let prevTravelDistance = 0;
  let prevArrivalTime = 0;
  // For each path sequence
  for (const currentStopTime of allStopTimes.rows) {
    // Get existing stop _id from database
    const existingStopDocument = await GTFSAPIDB.Stop.findOne({ code: currentStopTime.stop_id }, '_id');
    // Calculate distance delta and update variable
    const currentDistanceDelta = currentStopTime.shape_dist_traveled - prevTravelDistance;
    prevTravelDistance = currentStopTime.shape_dist_traveled;
    // Format arrival_time
    const arrivalTimeFormatted = formatArrivalTime(currentStopTime.arrival_time);
    // Calculate travel time
    const currentTravelTime = calculateTimeDifference(prevArrivalTime, currentStopTime.arrival_time);
    prevArrivalTime = currentStopTime.arrival_time;
    // Save formatted stop time
    formattedSchedule.push({
      stop: existingStopDocument._id,
      allow_pickup: currentStopTime.pickup_type ? false : true,
      allow_drop_off: currentStopTime.drop_off_type ? false : true,
      distance_delta: currentDistanceDelta,
      arrival_time: arrivalTimeFormatted,
      arrival_time_operation: currentStopTime.arrival_time,
      travel_time: currentTravelTime,
    });
  }
  // Return result array
  return formattedSchedule;
  //
}

//
//
//

async function formatArrivalTime(arrival_time) {
  const arrival_time_array = arrival_time.split(':');
  let arrival_time_hours = arrival_time_array[0].padStart(2, '0');
  if (arrival_time_hours && Number(arrival_time_hours) > 23) {
    const arrival_time_hours_adjusted = Number(arrival_time_hours) - 24;
    arrival_time_hours = String(arrival_time_hours_adjusted).padStart(2, '0');
  }
  const arrival_time_minutes = arrival_time_array[1].padStart(2, '0');
  const arrival_time_seconds = arrival_time_array[2].padStart(2, '0');
  // Return formatted string
  return `${arrival_time_hours}:${arrival_time_minutes}:${arrival_time_seconds}`;
}

//
//
//

/**
 * UPDATE MUNICIPALITIES
 * Fetch Municipalities from www,
 * parse them and save them to MongoDB.
 * @async
 */
async function updateMunicipalities() {
  // Record the start time to later calculate operation duration
  console.log(`⤷ Updating Municipalities...`);
  const startTime = process.hrtime();
  // Fetch all Municipalities from www
  const response = await fetch('https://www.carrismetropolitana.pt/?api=municipalities');
  const allMunicipalities = await response.json();
  // Initate a temporary variable to hold updated Municipalities
  let updatedMunicipalityIds = [];
  // For each municipality, update its entry in the database
  for (const municipality of allMunicipalities) {
    const updatedMunicipalityDocument = await GTFSAPIDB.Municipality.findOneAndUpdate({ code: municipality.id }, { name: municipality.value }, { new: true, upsert: true });
    updatedMunicipalityIds.push(updatedMunicipalityDocument._id);
  }
  // Log count of updated Municipalities
  console.log(`⤷ Updated ${updatedMunicipalityIds.length} Municipalities.`);
  // Delete all Municipalities not present in the current update
  const deletedStaleMunicipalities = await GTFSAPIDB.Municipality.deleteMany({ _id: { $nin: updatedMunicipalityIds } });
  console.log(`⤷ Deleted ${deletedStaleMunicipalities.deletedCount} stale Municipalities.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Municipalities (${elapsedTime}).`);
  //
}

//
//
//

/**
 * UPDATE SHAPES
 * Query 'shapes' table to get all unique shapes already pre-formatted
 * to the final schema. For each result, create it's GeoJson representation
 * and save it to MongoDB.
 * @async
 */
async function updateShapes() {
  // Record the start time to later calculate operation duration
  console.log(`⤷ Updating Shapes...`);
  const startTime = process.hrtime();
  // Query Postgres for all unique shapes by shape_id
  const allShapes = await GTFSParseDB.connection.query(`
        SELECT
            shape_id AS code,
            ARRAY_AGG(
                JSON_BUILD_OBJECT(
                    'shape_pt_lat', shape_pt_lat,
                    'shape_pt_lon', shape_pt_lon,
                    'shape_pt_sequence', shape_pt_sequence,
                    'shape_dist_traveled', shape_dist_traveled
                )
            ) AS points
        FROM
            shapes
        GROUP BY
            shape_id
    `);
  // Initate a temporary variable to hold updated Shapes
  let updatedShapeIds = [];
  // For each shape, update its entry in the database
  for (const shape of allShapes.rows) {
    // Initiate a variable to hold the parsed shape
    let parsedShape = { ...shape };
    // Sort points to match sequence
    const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
    parsedShape.points.sort((a, b) => collator.compare(a.shape_pt_sequence, b.shape_pt_sequence));
    // Create geojson feature using turf
    parsedShape.geojson = turf.lineString(parsedShape.points.map((point) => [parseFloat(point.shape_pt_lon), parseFloat(point.shape_pt_lat)]));
    // Update or create new document
    const updatedShapeDocument = await GTFSAPIDB.Shape.findOneAndUpdate({ code: parsedShape.code }, parsedShape, { new: true, upsert: true });
    updatedShapeIds.push(updatedShapeDocument._id);
  }
  // Log count of updated Shapes
  console.log(`⤷ Updated ${updatedShapeIds.length} Shapes.`);
  // Delete all Shapes not present in the current update
  const deletedStaleShapes = await GTFSAPIDB.Shape.deleteMany({ _id: { $nin: updatedShapeIds } });
  console.log(`⤷ Deleted ${deletedStaleShapes.deletedCount} stale Shapes.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Shapes (${elapsedTime}).`);
  //
}

//
//
//

/**
 * UPDATE STOPS
 * Query 'stops' table to get all unique stops.
 * Save each result in MongoDB.
 * @async
 */
async function updateStops() {
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
}

//
//
//

/**
 * UPDATE LINES AND PATTERNS
 * Query 'routes' table to get all unique routes.
 * Save each result in MongoDB.
 * @async
 */
async function updateLinesAndPatterns() {
  // Record the start time to later calculate operation duration
  console.log(`⤷ Updating Lines and Patterns...`);
  const startTime = process.hrtime();
  // Query Postgres for all unique routes
  const allRoutes = await GTFSParseDB.connection.query('SELECT * FROM routes');
  // Sort allRoutes array by each routes 'route_id' property ascending
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  allRoutes.rows.sort((a, b) => collator.compare(a.route_id, b.route_id));
  // Group all routes into lines by route_short_name
  const allLines = allRoutes.rows.reduce((result, route) => {
    // Check if the route_short_name already exists as a line
    const existingLine = result.find((line) => line.route_short_name === route.route_short_name);
    // Add the route to the existing line
    if (existingLine) existingLine.routes.push(route);
    // Create a new line with the route
    else {
      result.push({
        code: route.route_short_name,
        short_name: route.route_short_name,
        long_name: route.route_long_name,
        color: route.route_color,
        text_color: route.route_text_color,
        routes: [route],
      });
    }
    // Return result for the next iteration
    return result;
  }, []);
  // Initate a temporary variable to hold updated Lines
  let updatedLineIds = [];
  // For each route in each line, save the corresponding trip
  for (const line of allLines) {
    // Save this line to MongoDB and hold on to the returned _id value
    const updatedLineDocument = await GTFSAPIDB.Line.findOneAndUpdate({ code: line.code }, line, { new: true, upsert: true });
    updatedLineIds.push(updatedLineDocument._id);
    // Iterate on each route for this line
    for (const route of line.routes) {
      // Get all trips associated with this route
      const allTrips = await GTFSParseDB.connection.query(`SELECT * FROM trips WHERE route_id = '${route.route_id}'`);
      // Define built patterns to save to the database
      let uniquePatterns = [];
      // Process all trips to create an array of patterns
      for (const trip of allTrips.rows) {
        // Setup a temporary key with the distinguishable values for each trip
        const uniquePatternCode = `${trip.route_id}_${trip.direction}`;
        // Parse trip
        const parsedTrip = {
          trip_code: trip.trip_id,
          calendar_code: trip.service_id,
          shape_code: trip.shape_id,
          dates: await getTripDates(trip.service_id),
          schedule: await getTripSchedule(trip.trip_id),
        };
        // Check if the pattern code already exists as a pattern
        const existingPattern = uniquePatterns.find((pattern) => pattern.code === uniquePatternCode);
        // If pattern already exists, add this trip to the trips array
        if (existingPattern) existingPattern.trips.push(parsedTrip);
        // Create a new pattern with the trip
        else {
          uniquePatterns.push({
            code: uniquePatternCode,
            headsign: trip.trip_headsign,
            direction: trip.direction,
            parent_line: updatedLineDocument._id,
            trips: [parsedTrip],
          });
        }
      }
      // Initate a temporary variable to hold updated Patterns
      let updatedPatternIds = [];
      // Update patterns in Database
      for (const pattern of uniquePatterns) {
        const updatedPatternDocument = await GTFSAPIDB.Pattern.findOneAndUpdate({ code: pattern.code }, pattern, { new: true, upsert: true });
        updatedPatternIds.push(updatedPatternDocument._id);
      }
      // Log count of updated Patterns
      console.log(`⤷ Updated ${updatedPatternIds.length} Patterns for route ${route.route_id}.`);
      // Delete all Patterns not present in the current update
      const deletedStalePatterns = await GTFSAPIDB.Pattern.deleteMany({ _id: { $nin: updatedPatternIds } });
      console.log(`⤷ Deleted ${deletedStalePatterns.deletedCount} stale Patterns for route ${route.route_id}.`);
      //
    }
  }
  // Log count of updated Lines
  console.log(`⤷ Updated ${updatedLineIds.length} Lines.`);
  // Delete all Lines not present in the current update
  const deletedStaleLines = await GTFSAPIDB.Line.deleteMany({ _id: { $nin: updatedLineIds } });
  console.log(`⤷ Deleted ${deletedStaleLines.deletedCount} stale Lines.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Lines (${elapsedTime}).`);
  //
}

//
//
//

//
// Export functions from this module
module.exports = {
  start: async () => {
    //

    /* * */

    // This function builds a JSON 'route' object by stiching information
    // available in the several GTFS standard files. These files were previously
    // imported to MySQL tables with corresponding names.
    // This 'route' object is composed of general route information, served municipalities
    // and directions. Each direction has an ID, a destination (headsign) a shape representation
    // and a collection of trips. Each trip in the same direction has an ID, a collection
    // of dates (calendar days) where the trip will happen, and a schedule. The schedule is
    // asequence of stops, each with its own info and arrival and departure times.

    // The building of these route objects happen sequentially, with four nested loops:
    //   1. The main loop, for all the routes in the database;
    //      2. All the directions for the same route (no more than 2);
    //         3. All the trips for the same direction;
    //            4. All the stops for the same trip;

    // At the end of each iteration of the first loop, each JSON route object is saved
    // to the MongoDB API database. If the route already existed, then it is updated.
    // Several routes can have the same route_short_name. This means that for the same 'line'
    // there is at least one 'base' and optionally serveral 'variants'. The base is always
    // the route_id with the lowest suffix (ex: 1234_0, or 1234_1 if no _0 exists) for all routes
    // with the same 'route_short_name'. After all individual routes are saved in the database,
    // further processing happens to find out the base for each line. These routes are saved
    // in the RouteSummary collection in MongoDB.

    /* * */

    //
    // MUNICIPALITIES
    // Fetch Municipalities from www and save them to MongoDB
    await updateMunicipalities();

    //
    // SHAPES
    // Fetch Shapes from Postgres and save them to MongoDB
    await updateShapes();

    //
    // STOPS
    // Fetch Stops from Postgres and save them to MongoDB
    await updateStops();

    //
    // LINES AND PATTERNS
    // Fetch Stops from Postgres and save them to MongoDB
    await updateLinesAndPatterns();

    //
  },
};
