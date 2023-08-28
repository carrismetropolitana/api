const FEEDERDB = require('../services/FEEDERDB');
const SERVERDB = require('../services/SERVERDB');
const timeCalc = require('../modules/timeCalc');

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
  const allDates = await FEEDERDB.connection.query(`SELECT date FROM calendar_dates WHERE service_id = '${service_id}'`);
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

function formatArrivalTime(arrival_time) {
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
 * UPDATE LINES AND PATTERNS
 * Query 'routes' table to get all unique routes.
 * Save each result in MongoDB.
 * @async
 */
module.exports = async () => {
  //

  // 0.
  // Record the start time to later calculate operation duration
  const startTime_global = process.hrtime();

  //
  //
  //

  // 1.
  // GROUP LINES
  // First group all routes into lines.
  // Lorem ipsum dolor sit amet.

  // 1.1,
  // Query Postgres for all unique routes
  console.log(`⤷ Querying database...`);
  const allRoutes = await FEEDERDB.connection.query('SELECT * FROM routes');

  // 1.2.
  // Sort allRoutes array by each route 'route_id' property, ascending
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  allRoutes.rows.sort((a, b) => collator.compare(a.route_id, b.route_id));

  // 1.3.
  // Group all routes into lines by route_short_name
  const allLines = allRoutes.rows.reduce((result, route) => {
    // 1.3.1.
    // Check if the route_short_name already exists as a line
    const existingLine = result.find((line) => line.short_name === route.route_short_name);
    // 1.3.2.
    // Add the route to the existing line or reate a new line with the route
    if (existingLine) {
      existingLine.routes.push(route);
    } else {
      result.push({
        code: route.route_short_name,
        short_name: route.route_short_name,
        long_name: route.route_long_name,
        color: route.route_color ? `#${route.route_color}` : '#000000',
        text_color: route.route_text_color ? `#${route.route_text_color}` : '#FFFFFF',
        municipalities: [],
        localities: [],
        facilities: [],
        patterns: [],
        routes: [route],
      });
    }
    // 1.3.3.
    // Return result for the next iteration
    return result;
  }, []);

  //
  //
  //

  // 2.
  // PARSE LINES, ROUTES & PATTERNS
  // Now, parse each line and create patterns.
  // Lorem ipsum dolor sit amet.

  const startTime_queryFind = process.hrtime();
  const allStopsArray = await SERVERDB.Stop.find().lean();
  console.log('query find all   ', timeCalc.getElapsedTime(startTime_queryFind));

  const allStops = new Map(allStopsArray.map((obj) => [obj.code, obj]));

  // 2.1.
  // Initiate variables to keep track of updated _ids
  let updatedLineIds = [];
  let updatedPatternIds = [];

  // 2.2.
  // For all trips of all routes of each line,
  // create unique patterns by grouping common trips
  // by 'pattern_id', 'direction_id'. 'trip_headsign' and 'shape_id'.
  for (const line of allLines) {
    //
    // 2.2.0.
    // Record the start time to later calculate operation duration
    const startTime_line = process.hrtime();

    // 2.2.1.
    // Initiate holding variables
    let uniqueLinePatterns = [];

    let linePassesByMunicipalities = new Set();
    let linePassesByLocalities = new Set();
    let linePassesByFacilities = new Set();

    // 2.2.2.
    // Iterate on each route for this line
    for (const route of line.routes) {
      //
      // 2.2.2.1.
      // Get all trips associated with this route

      const startTime_queryTrips = process.hrtime();

      const allTrips = await FEEDERDB.connection.query(`SELECT * FROM trips WHERE route_id = '${route.route_id}'`);

      console.log(`  ⤷ ${route.route_id} (${elapsedTime_queryTrips}).`);

      function toNs(timePair) {
        return timePair[0] * 1000000000 + timePair[1];
      }

      // 2.2.2.2.
      // Reduce all trips into unique patterns. Do this for all routes of the current line.
      // Patterns are combined by the unique combination of 'pattern_id', 'direction_id', 'trip_headsign' and 'shape_id'.
      for (const trip of allTrips.rows) {
        //
        // 2.2.2.2.1.
        // Find the pattern that matches the unique combination for this trip
        const pattern = uniqueLinePatterns.find((pattern) => {
          const samePatternId = pattern.code === trip.pattern_id;
          const sameDirectionId = pattern.direction === trip.direction_id;
          const sameHeadsign = pattern.headsign === trip.trip_headsign;
          //   const sameShapeId = pattern.shape.shape_code === trip.shape_id;
          return sameDirectionId && samePatternId && sameHeadsign;
        });

        // 2.2.2.2.2.
        // Get the current trip stop_times
        const startTime_queryTimes = process.hrtime();

        const allStopTimes = await FEEDERDB.connection.query(`SELECT * FROM stop_times WHERE trip_id = '${trip.trip_id}' ORDER BY stop_sequence`);
        queryTimesTime += toNs(process.hrtime()) - toNs(startTime_queryTimes);

        // 2.2.2.2.3.
        // Initiate temporary holding variables
        let formattedPath = [];
        let formattedSchedule = [];

        let prevTravelDistance = 0;
        let prevArrivalTime = 0;

        let patternPassesByMunicipalities = new Set();
        let patternPassesByLocalities = new Set();
        let patternPassesByFacilities = new Set();

        // const allStopIds = allStopTimes.rows.map((item) => {
        //   return item.stop_id;
        // });

        // const startTime_queryFind = process.hrtime();
        // const allStopsForThisTrip = await SERVERDB.Stop.find({ code: { $in: allStopIds } }).lean();
        // queryFindOne += toNs(process.hrtime()) - toNs(startTime_queryFind);

        // 2.2.2.2.4.
        // For each path sequence
        for (const currentStopTime of allStopTimes.rows) {
          //
          // 2.2.2.2.4.1.
          // Get existing stop document from database
          const existingStopDocument = allStops.get(currentStopTime.stop_id);

          // 2.2.2.2.4.2.
          // Calculate distance delta and update variable
          const currentDistanceDelta = Number(currentStopTime.shape_dist_traveled) - prevTravelDistance;
          prevTravelDistance = Number(currentStopTime.shape_dist_traveled);

          // 2.2.2.2.4.3.
          // Format arrival_time
          const arrivalTimeFormatted = formatArrivalTime(currentStopTime.arrival_time);

          // 2.2.2.2.4.4.
          // Calculate travel time
          const currentTravelTime = calculateTimeDifference(prevArrivalTime, currentStopTime.arrival_time);
          prevArrivalTime = currentStopTime.arrival_time;

          // 2.2.2.2.4.5.
          // Save formatted stop_time to path in no pattern with the unique combination exists
          if (!pattern) {
            formattedPath.push({
              stop: existingStopDocument,
              allow_pickup: currentStopTime.pickup_type ? false : true,
              allow_drop_off: currentStopTime.drop_off_type ? false : true,
              distance_delta: currentDistanceDelta,
            });
          }

          // 2.2.2.2.4.6.
          // Save formatted stop_time to schedule
          formattedSchedule.push({
            stop_code: existingStopDocument.code,
            arrival_time: arrivalTimeFormatted,
            arrival_time_operation: currentStopTime.arrival_time,
            travel_time: currentTravelTime,
          });

          // 2.2.2.2.4.7.
          // Associate the current stop municipality to the current line and pattern
          linePassesByMunicipalities.add(existingStopDocument.municipality_code);
          patternPassesByMunicipalities.add(existingStopDocument.municipality_code);

          // 2.2.2.2.4.7.
          // Associate the current stop locality to the current line and pattern
          linePassesByLocalities.add(existingStopDocument.locality);
          patternPassesByLocalities.add(existingStopDocument.locality);

          // 2.2.2.2.4.8. (TBD)
          // Associate the current stop facility to the current line and pattern
          //   linePassesByFacilities.add(existingStopDocument.locality);
          //   patternPassesByFacilities.add(existingStopDocument.locality);

          //
        }

        // 2.2.2.2.5.
        // Get current trip dates.
        const tripDates = await getTripDates(trip.service_id);

        // 2.2.2.2.6.
        // Create a new formatted trip object
        const formattedTrip = {
          code: trip.trip_id,
          calendar_code: trip.service_id,
          dates: tripDates,
          schedule: formattedSchedule,
        };

        // 2.2.2.2.7.
        // If there is already a pattern matching the unique combination of trip values,
        // then update it with the current formatted trip and new valid_on dates
        // and skip to the next iteration.
        if (pattern) {
          pattern.valid_on = [...new Set([...pattern.valid_on, ...tripDates])];
          pattern.trips.push(formattedTrip);
          continue;
        }

        // 2.2.2.2.8.
        // If no pattern was found matching the unique combination,
        // then create a new one with the formatted path and formatted trip values.
        uniqueLinePatterns.push({
          //
          code: trip.pattern_id,
          direction: trip.direction_id,
          headsign: trip.trip_headsign,
          //
          line_code: line.code,
          short_name: line.short_name,
          color: line.color,
          text_color: line.text_color,
          //
          valid_on: tripDates,
          //
          municipalities: Array.from(patternPassesByMunicipalities),
          localities: Array.from(patternPassesByLocalities),
          facilities: Array.from(patternPassesByFacilities),
          //
          shape_code: trip.shape_id,
          //
          path: formattedPath,
          //
          trips: [formattedTrip],
          //
        });

        //
      }
      console.log(`  ⤷ queryTimesTime ${queryTimesTime / 1000000}`);
      console.log(`  ⤷ queryFindAll ${queryFindOne / 1000000}`);

      //
    }

    // 2.2.3.
    // Update the current line with the associated municipalities and facilities
    line.municipalities = Array.from(linePassesByMunicipalities);
    line.localities = Array.from(linePassesByLocalities);
    line.facilities = Array.from(linePassesByFacilities);

    // 2.2.4.
    // Save all created patterns to the database
    for (const pattern of uniqueLinePatterns) {
      const updatedPatternDocument = await SERVERDB.Pattern.findOneAndReplace({ code: pattern.code }, pattern, { new: true, upsert: true });
      updatedPatternIds.push(updatedPatternDocument._id.toString());
      line.patterns.push(pattern.code);
    }

    // 2.2.5.
    // Save the current line to MongoDB and hold on to the returned _id value
    const updatedLineDocument = await SERVERDB.Line.findOneAndReplace({ code: line.code }, line, { new: true, upsert: true });
    updatedLineIds.push(updatedLineDocument._id.toString());

    // 2.2.6.
    // Log operation details and elapsed time
    const elapsedTime_line = timeCalc.getElapsedTime(startTime_line);
    console.log(`⤷ Updated Line ${line.code} and its ${uniqueLinePatterns.length} Patterns in ${elapsedTime_line}.`);

    //
  }

  // 2.3.
  // Delete all Lines not present in the current update
  const deletedStaleLines = await SERVERDB.Line.deleteMany({ _id: { $nin: updatedLineIds } });
  console.log(`⤷ Deleted ${deletedStaleLines.deletedCount} stale Lines.`);

  // 2.4.
  // Delete all Patterns not present in the current update
  const deletedStalePatterns = await SERVERDB.Pattern.deleteMany({ _id: { $nin: updatedPatternIds } });
  console.log(`⤷ Deleted ${deletedStalePatterns.deletedCount} stale Patterns.`);

  // 2.5.
  // Log elapsed time in the current operation
  const elapsedTime_global = timeCalc.getElapsedTime(startTime_global);
  console.log(`⤷ Done updating Lines (${elapsedTime_global}).`);

  //
};
