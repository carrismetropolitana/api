/* * * * * */
/* DATABASE */
/* * */

/* * */
/* IMPORTS */
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');

//
const getUniqueRouteShortNamesAtEachStop = async () => {
  try {
    const startTime = process.hrtime();
    console.log(`⤷ Querying database...`);
    const [rows, fields] = await GTFSParseDB.connection.execute(`
    SELECT 
        stops.stop_id, 
        stops.stop_name, 
        stops.stop_lat, 
        stops.stop_lon, 
        GROUP_CONCAT(DISTINCT routes.route_short_name ORDER BY routes.route_short_name SEPARATOR ',') as routes 
    FROM 
        stops 
        JOIN stop_times ON stops.stop_id = stop_times.stop_id 
        JOIN trips ON stop_times.trip_id = trips.trip_id 
        JOIN routes ON trips.route_id = routes.route_id 
    GROUP BY 
        stops.stop_id, 
        stops.stop_name, 
        stops.stop_lat, 
        stops.stop_lon 
    ORDER BY 
        stops.stop_id;
    `);
    const elapsedTime = timeCalc.getElapsedTime(startTime);
    console.log(`⤷ Done querying the database in ${elapsedTime}.`);
    return rows;
  } catch (err) {
    console.log('Error at getUniqueRouteShortNamesAtEachStop()', err);
  }
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

    // Setup a counter that holds all processed stop_ids.
    // This will be used at the end to remove stale data from the database.
    let allUpdatedStopIds = [];

    // Get all stops from GTFS table (stops.txt)
    const allStopsWithRoutes = await getUniqueRouteShortNamesAtEachStop();

    for (const currentStop of allStopsWithRoutes) {
      //

      /* * DEBUG * */
      counter++;
      const startTime = process.hrtime();
      /* * DEBUG * */

      // Initiate the formatted route object
      // with the direct values taken from the GTFS table.
      let formattedStop = {
        stop_id: currentStop.stop_id,
        stop_name: currentStop.stop_name,
        stop_lat: currentStop.stop_lat,
        stop_lon: currentStop.stop_lon,
        routes: [],
      };

      for (const foundRouteShortName of currentStop.routes.split(',')) {
        const foundRouteSummaryObject = await GTFSAPIDB.RouteSummary.findOne({ route_short_name: foundRouteShortName });
        if (foundRouteSummaryObject) {
          formattedStop.routes.push(foundRouteSummaryObject);
        }
      }

      await GTFSAPIDB.Stop.findOneAndUpdate({ stop_id: formattedStop.stop_id }, formattedStop, { upsert: true });

      const elapsedTime = timeCalc.getElapsedTime(startTime);
      console.log(`⤷ [${counter}/${allStopsWithRoutes.length}] Saved stop ${formattedStop.stop_id} to API Database in ${elapsedTime}.`);

      allUpdatedStopIds.push(formattedStop.stop_id);

      //
    }

    // DELETE FROM STOPS DB IF NOT IN ARRAY OF UPDATED IDS
    const allStopIdsInDatabase = await GTFSAPIDB.Stop.distinct('stop_id');
    for (const existingStopId of allStopIdsInDatabase) {
      // Check if this stop_id from the big database
      // is in the array of newly updated stop_ids
      const isStillValidStopId = allUpdatedStopIds.includes(existingStopId);
      // If the stop_id is not valid, delete it from the database
      if (!isStillValidStopId) {
        await GTFSAPIDB.Stop.deleteOne({ stop_id: existingStopId });
        console.log(`⤷ Deleted stale stop ${existingStopId} from API Database.`);
      }
    }

    //
  },
};
