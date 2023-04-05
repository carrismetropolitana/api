/* * */
/* IMPORTS */
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');

/**
 * Fetch municipalities from www
 * @async
 * @returns {Array} Array of municipalities
 */
const getMunicipalities = async () => {
  try {
    const response = await fetch('https://www.carrismetropolitana.pt/?api=municipalities');
    if (response.ok) return response.json();
  } catch (err) {
    console.log('Error at getMunicipalities()', err);
  }
};

//
//
//

//
// Download file from URL
const getAllRoutes = async () => {
  try {
    const [rows, fields] = await GTFSParseDB.connection.execute('SELECT route_id FROM routes');
    console.log(rows);
    return rows;
  } catch (err) {
    console.log('Error at getAllRoutes()', err);
  }
};

//
//
//

/**
 * Query SQL for route information
 * @async
 * @returns {Array} Array of municipalities
 */
const getRouteInfo = async (routeId) => {
  const [rows, fields] = await GTFSParseDB.connection.execute(
    `
      SELECT
          r.route_id,
          r.route_short_name,
          r.route_long_name,
          r.route_color,
          r.route_text_color,
          s.stop_sequence,
          s.stop_id,
          s.stop_name,
          s.stop_lat,
          s.stop_lon,
          st.arrival_time,
          st.departure_time,
          st.shape_dist_traveled,
          t.trip_id,
          t.service_id,
          t.direction_id,
          t.shape_id,
          t.trip_headsign,
          s.shape_pt_lat,
          s.shape_pt_lon,
          s.shape_pt_sequence
      FROM
          routes r
          INNER JOIN trips t ON r.route_id = t.route_id
          INNER JOIN stop_times st ON t.trip_id = st.trip_id
          INNER JOIN stops s ON st.stop_id = s.stop_id
      WHERE
          r.route_id = ?
      ORDER BY
          t.trip_id, s.stop_sequence
      `,
    [routeId]
  );
  console.log(rows);
  return rows;
};

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

//
// Download file from URL
const getRoutes = async () => {
  try {
    const [rows, fields] = await GTFSParseDB.connection.execute('SELECT * FROM routes');
    return rows.map((r) => {
      return {
        route_id: r.route_id,
        route_short_name: r.route_short_name,
        route_long_name: r.route_long_name,
        route_color: r.route_color,
        route_text_color: r.route_text_color,
        route_type: r.route_type,
        circular: r.circular,
      };
    });
  } catch (err) {
    console.log('Error at buildRoutes()', err);
  }
};

const getTrips = async (routeId) => {
  try {
    const [rows, fields] = await GTFSParseDB.connection.execute('SELECT * FROM trips WHERE route_id = ?', [routeId]);
    return rows;
  } catch (err) {
    console.log('Error at getTrips()', err);
  }
};

const getShape = async (shapeId) => {
  try {
    const [rows, fields] = await GTFSParseDB.connection.execute('SELECT * FROM shapes WHERE shape_id = ?', [shapeId]);
    return rows;
  } catch (err) {
    console.log('Error at getShape()', err);
  }
};

const getPath = async (tripId) => {
  try {
    const [rows, fields] = await GTFSParseDB.connection.execute('SELECT * FROM stop_times WHERE trip_id = ?', [tripId]);
    return rows;
  } catch (err) {
    console.log('Error at getPath()', err);
  }
};

const getStop = async (stopId) => {
  const [rows, fields] = await GTFSParseDB.connection.execute('SELECT * FROM stops WHERE stop_id = ?', [stopId]);
  return rows[0];
};

const getDates = async (serviceId) => {
  const [rows, fields] = await GTFSParseDB.connection.execute('SELECT * FROM calendar_dates WHERE service_id = ? AND exception_type = 1', [serviceId]);
  return rows;
};

//
// Export functions from this module
module.exports = {
  start: async () => {
    //

    /* * DEBUG * */
    let counter = 0;
    /* * DEBUG * */

    // OVERVIEW OF THIS FUNCTION
    // Lorem ipsum

    // Fetch Municipalities API
    const allMunicipalities = await getMunicipalities();

    // Setup a counter that holds all processed route_ids.
    // This will be used at the end to remove stale data from the database.
    let allUpdatedRouteIds = [];

    // Get all routes from GTFS table (routes.txt)
    const allRoutes_raw = await getRoutes();
    const allRoutes_raw2 = await getAllRoutes();

    for (const currentRoute of allRoutes_raw2) {
      const test = getRouteInfo(currentRoute);
    }

    for (const currentRoute of allRoutes_raw) {
      //

      /* * DEBUG * */
      const startTime = process.hrtime();
      counter++;
      /* * DEBUG * */

      // Initiate the formatted route object
      // with the direct values taken from the GTFS table.
      let formattedRoute = {
        route_id: currentRoute.route_id,
        route_short_name: currentRoute.route_short_name,
        route_long_name: currentRoute.route_long_name,
        route_color: `#${currentRoute.route_color || 'FA3250'}`,
        route_text_color: `#${currentRoute.route_text_color || 'FFFFFF'}`,
        municipalities: [],
      };

      // Get all trips associated with this route
      const allTrips_raw = await getTrips(currentRoute.route_id);

      // Simplify trips array by combining common attributes
      const allTrips_simplified = allTrips_raw.map((item) => {
        return { direction_id: item.direction_id, headsign: item.trip_headsign, shape_id: item.shape_id };
      });

      // Deduplicate simplified trips array to keep only common attributes.
      // This essentially results in an array of 'directions'. Save it to the route object.
      formattedRoute.directions = allTrips_simplified.filter((value, index, array) => {
        return index === array.findIndex((valueInner) => JSON.stringify(valueInner) === JSON.stringify(value));
      });

      // For each direction
      await Promise.all(
        formattedRoute.directions.map(async (currentDirection) => {
          // Get shape for this direction and sort it
          const shape_raw = await getShape(currentDirection.shape_id);
          const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
          currentDirection.shape = shape_raw.sort((a, b) => collator.compare(a.shape_pt_sequence, b.shape_pt_sequence));
          // Initiate the
          currentDirection.trips = [];
          // iusdh
          for (const currentTrip of allTrips_raw) {
            // For all trips matching the current direction_id
            if (currentTrip.direction_id === currentDirection.direction_id) {
              // Get dates in the YYYYMMDD format (GTFS Standard format)
              const allDates_raw = await getDates(currentTrip.service_id);
              const allDates_formatted = allDates_raw.map((item) => item.date);
              // Get stop times for each trip
              const allStopTimes_raw = await getPath(currentTrip.trip_id);
              const allStopTimes_formatted = await Promise.all(
                allStopTimes_raw.map(async (currentStopTime) => {
                  const stopInfo = await getStop(currentStopTime.stop_id);
                  if (!stopInfo) return console.log('⚠️ Error in stop:', stopInfo);

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
                  const municipalityId = stopInfo.stop_id?.substr(0, 2);
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
                  // Return formatted stop_time
                  return {
                    stop_sequence: currentStopTime.stop_sequence,
                    stop_id: currentStopTime.stop_id,
                    stop_name: stopInfo.stop_name,
                    stop_lon: stopInfo.stop_lon,
                    stop_lat: stopInfo.stop_lat,
                    arrival_time: `${arrival_time_hours}:${arrival_time_minutes}:${arrival_time_seconds}`,
                    arrival_time_operation: currentStopTime.arrival_time,
                    departure_time: `${departure_time_hours}:${departure_time_minutes}:${departure_time_seconds}`,
                    departure_time_operation: currentStopTime.departure_time,
                    shape_dist_traveled: currentStopTime.shape_dist_traveled,
                  };
                })
              );
              // Save trip object to trips array
              currentDirection.trips.push({
                trip_id: currentTrip.trip_id,
                dates: allDates_formatted,
                schedule: allStopTimes_formatted,
              });
            }
          }
          // Sort trips by departure_time ASC
          currentDirection.trips.sort((a, b) => (a.schedule[0]?.departure_time_operation > b.schedule[0]?.departure_time_operation ? 1 : -1));
          // Save the modified object
          return currentDirection;
          //
        })
      );

      await GTFSAPIDB.Route.findOneAndUpdate({ route_id: formattedRoute.route_id }, formattedRoute, { upsert: true });

      const elapsedTime = timeCalc.getElapsedTime(startTime);
      console.log(`⤷ [${counter}/${allRoutes_raw.length}] Saved route ${formattedRoute.route_id} to API Database in ${elapsedTime}.`);

      allUpdatedRouteIds.push(formattedRoute.route_id);

      //
    }

    // DELETE FROM ROUTES DB IF NOT IN ARRAY OF UPDATED IDS
    let updatedRouteSummaryIds = [];
    const allRouteIdsInDatabase = await GTFSAPIDB.Route.distinct('route_id');
    for (const existingRouteId of allRouteIdsInDatabase) {
      // Check if this route_id in the big database
      // is in the array of newly updated route_ids
      const isStillValidRouteId = allUpdatedRouteIds.includes(existingRouteId);
      // If the route_id is not valid, delete it from the database
      if (!isStillValidRouteId) {
        await GTFSAPIDB.Route.deleteOne({ route_id: existingRouteId });
        console.log(`⤷ Deleted stale ${existingRouteId} from API Database.`);
      } else {
        const routeShortNameForRouteId = existingRouteId.substring(0, 4);
        const allVariantsForRouteShortName = await GTFSAPIDB.Route.find({ route_short_name: routeShortNameForRouteId });
        const allVariantsForRouteShortName_sorted = allVariantsForRouteShortName.sort((a, b) => {
          return a.route_id < b.route_id;
        });
        if (allVariantsForRouteShortName_sorted.length) {
          await GTFSAPIDB.RouteSummary.findOneAndUpdate(
            { route_id: allVariantsForRouteShortName_sorted[0].route_id },
            {
              route_id: allVariantsForRouteShortName_sorted[0].route_id,
              route_short_name: allVariantsForRouteShortName_sorted[0].route_short_name,
              route_long_name: allVariantsForRouteShortName_sorted[0].route_long_name,
              route_color: allVariantsForRouteShortName_sorted[0].route_color,
              route_text_color: allVariantsForRouteShortName_sorted[0].route_text_color,
              municipalities: allVariantsForRouteShortName_sorted[0].municipalities,
            },
            {
              upsert: true,
            }
          );
          updatedRouteSummaryIds.push(allVariantsForRouteShortName_sorted[0].route_id);
          console.log(`⤷ Saved route summary ${allVariantsForRouteShortName_sorted[0].route_id} to API Database.`);
        }
      }
    }

    // DELETE FROM ROUTES SUMMARY DB IF NOT IN ARRAY OF UPDATED IDS
    const allRouteSummaryIdsInDatabase = await GTFSAPIDB.RouteSummary.distinct('route_id');
    for (const existingRouteSummaryId of allRouteSummaryIdsInDatabase) {
      // Check if this route_id in the summary database
      // is in the array of newly updated route_ids
      const isStillValidRouteSummaryId = updatedRouteSummaryIds.includes(existingRouteSummaryId);
      // If the route_id is not valid, delete it from the database
      if (!isStillValidRouteSummaryId) {
        await GTFSAPIDB.RouteSummary.deleteOne({ route_id: existingRouteSummaryId });
        console.log(`⤷ Deleted stale ${existingRouteSummaryId} summary from API Database.`);
      }
    }

    //
  },
};
