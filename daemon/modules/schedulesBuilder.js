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
 * Retrieve all routes from 'routes' table
 * @async
 * @returns {Array} Array of route objects
 */
async function getRoutes() {
  const [rows, fields] = await GTFSParseDB.connection.query(`
    SELECT
        route_id,
        route_short_name,
        route_long_name,
        route_color,
        route_text_color,
        route_type
    FROM
        routes
  `);
  return rows;
}

//
//
//

/**
 * Retrieve trips matching the provided route_id
 * @async
 * @param {String} route_id The route_id related to the trip
 * @returns {Array} Array of trip objects
 */
async function getTrips(route_id) {
  const [rows, fields] = await GTFSParseDB.connection.query(
    `
        SELECT
            trip_id,
            direction_id,
            trip_headsign,
            service_id,
            shape_id
        FROM
            trips
        WHERE
            route_id = ?
    `,
    [route_id]
  );
  return rows;
}

//
//
//

/**
 * Retrieve shape matching the provided shape_id
 * @async
 * @param {String} shape_id The shape_id to retrieve
 * @returns {Array} Array of shape points
 */
async function getShape(shape_id) {
  const [rows, fields] = await GTFSParseDB.connection.query(
    `
        SELECT
            shape_id,
            shape_pt_lat,
            shape_pt_lon,
            shape_pt_sequence,
            shape_dist_traveled
        FROM
            shapes
        WHERE
            shape_id = ?
    `,
    [shape_id]
  );
  return rows;
}

//
//
//

/**
 * Retrieve the dates matching the provided service_id
 * @async
 * @param {String} service_id The service_id to retrieve
 * @returns {Array} Array of date strings
 */
async function getDates(service_id) {
  const [rows, fields] = await GTFSParseDB.connection.query(
    `
        SELECT
            date
        FROM
            calendar_dates
        WHERE
            service_id = ?
    `,
    [service_id]
  );
  return rows;
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
async function getStopTimes(trip_id) {
  const [rows, fields] = await GTFSParseDB.connection.query(
    `
        SELECT
            st.stop_id,
            st.stop_sequence,
            st.arrival_time,
            st.departure_time,
            s.stop_name,
            s.stop_lat,
            s.stop_lon
        FROM
            stop_times st
            INNER JOIN stops s ON st.stop_id = s.stop_id
        WHERE
            st.trip_id = ?
        ORDER BY
            st.stop_sequence
    `,
    [trip_id]
  );
  return rows;
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
  const startTime = process.hrtime();
  // Fetch all Municipalities from www
  const response = await fetch('https://www.carrismetropolitana.pt/?api=municipalities');
  const allMunicipalities = await response.json();
  // Initate a temporary variable to hold updated Municipalities
  let updatedMunicipalityIds = [];
  // For each municipality, update its entry in the database
  for (const municipality of allMunicipalities) {
    const updatedDocument = await GTFSAPIDB.Municipality.findOneAndUpdate({ code: municipality.id }, { name: municipality.value }, { new: true, upsert: true });
    updatedMunicipalityIds.push(updatedDocument._id);
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
    parsedShape.points.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
    // Create geojson feature using turf
    parsedShape.geojson = turf.lineString(parsedShape.points.map((point) => [parseFloat(point.shape_pt_lon), parseFloat(point.shape_pt_lat)]));
    // Update or create new document
    const updatedDocument = await GTFSAPIDB.Shape.findOneAndUpdate({ code: parsedShape.code }, parsedShape, { new: true, upsert: true });
    updatedShapeIds.push(updatedDocument._id);
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
    const updatedDocument = await GTFSAPIDB.Stop.findOneAndUpdate({ code: parsedStop.code }, parsedStop, { new: true, upsert: true });
    updatedStopIds.push(updatedDocument._id);
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

    // Setup a counter that holds all processed route_ids.
    // This is used at the end to remove stale data from the database.
    let allProcessedRouteIds = [];

    // Get all routes from GTFS table (routes.txt)
    const allRoutes = await getRoutes();

    // LOOP 1 — Routes
    for (const currentRoute of allRoutes) {
      //
      // Record the start time to later calculate duration
      const startTime = process.hrtime();

      // Add this route to the counter
      allProcessedRouteIds.push(currentRoute.route_id);

      // Initiate the formatted route object
      let formattedRoute = {
        route_id: currentRoute.route_id,
        route_short_name: currentRoute.route_short_name,
        route_long_name: currentRoute.route_long_name,
        route_color: `#${currentRoute.route_color || 'FA3250'}`,
        route_text_color: `#${currentRoute.route_text_color || 'FFFFFF'}`,
        municipalities: [],
        directions: [],
      };

      // Get all trips associated with this route
      const allTrips_raw = await getTrips(currentRoute.route_id);

      // Simplify trips array by removing non-common attributes
      const allTrips_simplified = allTrips_raw.map((trip) => {
        return { direction_id: trip.direction_id, headsign: trip.trip_headsign, shape_id: trip.shape_id };
      });

      // Deduplicate simplified trips array to keep only common attributes.
      // This essentially results in an array of 'directions'. Save it to the route object.
      const allDirections = allTrips_simplified.filter((value, index, array) => {
        return index === array.findIndex((valueInner) => JSON.stringify(valueInner) === JSON.stringify(value));
      });

      // LOOP 2 — Directions
      for (const currentDirection of allDirections) {
        //
        // Initiate the formatted direction object
        let formattedDirection = {
          direction_id: currentDirection.direction_id,
          headsign: currentDirection.headsign,
          shape: [],
          trips: [],
        };

        // Get shape for this direction and sort it by 'shape_pt_sequence'
        // The use of collator here is to ensure 'natural sorting' on numeric strings: https://stackoverflow.com/questions/2802341/natural-sort-of-alphanumerical-strings-in-javascript
        const shape_raw = await getShape(currentDirection.shape_id);
        const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
        formattedDirection.shape = shape_raw.sort((a, b) => collator.compare(a.shape_pt_sequence, b.shape_pt_sequence));

        // LOOP 3 - Trips
        for (const currentTrip of allTrips_raw) {
          //
          // Skip all trips that do not belong to the current direction
          if (currentTrip.direction_id !== currentDirection.direction_id) continue;

          // Initiate the formatted trip object
          let formattedTrip = {
            trip_id: currentTrip.trip_id,
            service_id: currentTrip.service_id,
            dates: [],
            schedule: [],
          };

          // Get dates in the YYYYMMDD format (GTFS Standard format)
          const allDates_raw = await getDates(currentTrip.service_id);
          formattedTrip.dates = allDates_raw.map((item) => item.date);

          // Get stop times for this trip
          const allStopTimes_raw = await getStopTimes(currentTrip.trip_id);

          // LOOP 4 - Stop Times
          for (const currentStopTime of allStopTimes_raw) {
            //
            // Format arrival_time
            const arrival_time_array = currentStopTime.arrival_time.split(':');
            let arrival_time_hours = arrival_time_array[0].padStart(2, '0');
            if (arrival_time_hours && Number(arrival_time_hours) > 23) {
              const arrival_time_hours_adjusted = Number(arrival_time_hours) - 24;
              arrival_time_hours = String(arrival_time_hours_adjusted).padStart(2, '0');
            }
            const arrival_time_minutes = arrival_time_array[1].padStart(2, '0');
            const arrival_time_seconds = arrival_time_array[2].padStart(2, '0');

            // Format departure_time
            const departure_time_array = currentStopTime.departure_time.split(':');
            let departure_time_hours = departure_time_array[0].padStart(2, '0');
            if (departure_time_hours && Number(departure_time_hours) > 23) {
              const departure_time_hours_adjusted = Number(departure_time_hours) - 24;
              departure_time_hours = String(departure_time_hours_adjusted).padStart(2, '0');
            }
            const departure_time_minutes = departure_time_array[1].padStart(2, '0');
            const departure_time_seconds = departure_time_array[2].padStart(2, '0');

            // Find out which municipalities this route serves
            // using the first two digits of stop_id
            const municipalityId = currentStopTime.stop_id?.substr(0, 2);
            // Check if this municipaliy is already in the route
            const alreadyHasMunicipality = formattedRoute.municipalities?.findIndex((item) => {
              return municipalityId === item.id;
            });
            // Add the municipality if it is still not added
            if (alreadyHasMunicipality < 0) {
              const stopMunicipality = allMunicipalities.filter((item) => {
                return municipalityId === item.id;
              });
              if (stopMunicipality.length) {
                formattedRoute.municipalities.push(stopMunicipality[0]);
              }
            }
            // Save formatted stop time
            formattedTrip.schedule.push({
              stop_sequence: currentStopTime.stop_sequence,
              stop_id: currentStopTime.stop_id,
              stop_name: currentStopTime.stop_name,
              stop_lon: currentStopTime.stop_lon,
              stop_lat: currentStopTime.stop_lat,
              arrival_time: `${arrival_time_hours}:${arrival_time_minutes}:${arrival_time_seconds}`,
              arrival_time_operation: currentStopTime.arrival_time,
              departure_time: `${departure_time_hours}:${departure_time_minutes}:${departure_time_seconds}`,
              departure_time_operation: currentStopTime.departure_time,
              shape_dist_traveled: currentStopTime.shape_dist_traveled,
            });
          }

          // Save trip object to trips array
          formattedDirection.trips.push(formattedTrip);
        }

        // Sort trips by departure_time ASC
        formattedDirection.trips.sort((a, b) => (a.schedule[0]?.departure_time_operation > b.schedule[0]?.departure_time_operation ? 1 : -1));

        // Save this direction in formattedRoutes
        formattedRoute.directions.push(formattedDirection);
      }

      // Save route to MongoDB
      await GTFSAPIDB.Route.findOneAndUpdate({ route_id: formattedRoute.route_id }, formattedRoute, { upsert: true });

      const elapsedTime = timeCalc.getElapsedTime(startTime);
      console.log(`⤷ [${allProcessedRouteIds.length}/${allRoutes.length}] Saved route ${formattedRoute.route_id} to API Database in ${elapsedTime}.`);

      //
    }

    // Delete all documents with route_ids not present in the new GTFS version
    const deletedStaleRoutes = await GTFSAPIDB.Route.deleteMany({ route_id: { $nin: allProcessedRouteIds } });
    console.log(`⤷ Deleted ${deletedStaleRoutes.deletedCount} stale routes.`);

    // Retrieve all distinct route_short_names and iterate on each one.
    const allRouteBasesInDatabase = await GTFSAPIDB.Route.aggregate([
      {
        $sort: {
          route_id: 1,
        },
      },
      {
        $group: {
          _id: '$route_short_name',
          route_id: { $first: '$route_id' },
          route_long_name: { $first: '$route_long_name' },
          route_color: { $first: '$route_color' },
          route_text_color: { $first: '$route_text_color' },
          municipalities: { $first: '$municipalities' },
        },
      },
      {
        $project: {
          _id: 0,
          route_id: 1,
          route_short_name: '$_id',
          route_long_name: 1,
          route_color: 1,
          route_text_color: 1,
          municipalities: 1,
        },
      },
    ]);

    // Update the database with the new group of route bases
    for (const routeBase of allRouteBasesInDatabase) {
      await GTFSAPIDB.RouteSummary.findOneAndUpdate({ route_id: routeBase.route_id }, routeBase, { upsert: true });
      console.log(`⤷ Saved route base ${routeBase.route_id} to API Database.`);
    }

    // Delete all route bases not present in the last update
    const allProcessedBaseRouteIds = allRouteBasesInDatabase.map((item) => item.route_id);
    const deletedStaleRouteBases = await GTFSAPIDB.RouteSummary.deleteMany({ route_id: { $nin: allProcessedBaseRouteIds } });
    console.log(`⤷ Deleted ${deletedStaleRouteBases.deletedCount} stale route bases.`);

    //
  },
};
