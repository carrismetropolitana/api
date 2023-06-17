/* * */
/* IMPORTS */
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');

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
    // const existingStopDocument = await GTFSAPIDB.Stop.findOne({ code: currentStopTime.stop_id }, '_id');
    // Calculate distance delta and update variable
    const currentDistanceDelta = Number(currentStopTime.shape_dist_traveled) - prevTravelDistance;
    prevTravelDistance = Number(currentStopTime.shape_dist_traveled);
    // Format arrival_time
    const arrivalTimeFormatted = formatArrivalTime(currentStopTime.arrival_time);
    // Calculate travel time
    const currentTravelTime = calculateTimeDifference(prevArrivalTime, currentStopTime.arrival_time);
    prevArrivalTime = currentStopTime.arrival_time;
    // Save formatted stop time
    formattedSchedule.push({
      stop_code: currentStopTime.stop_id,
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

/**
 * Retrieve stops for the given trip_id
 * @async
 * @param {String} trip_id The trip_id to retrieve from stop_times
 * @returns {Array} Array of stops objects
 */

module.exports = async ({ chunk }) => {
  // Initiate variables to keep track of updated _ids
  let updatedLineIds = [];
  let updatedPatternIds = [];
  // Loop through each object in each chunk
  for (const line of chunk) {
    // Define built patterns to save to the database
    let uniquePatterns = [];
    // Iterate on each route for this line
    for (const route of line.routes) {
      // Get all trips associated with this route
      console.log('Query trips table for line', line.code);
      const allTrips = await GTFSParseDB.connection.query(`SELECT * FROM trips WHERE route_id = '${route.route_id}'`);
      console.log('Done query trips table for line', line.code);
      // Process all trips to create an array of patterns
      for (const trip of allTrips.rows) {
        // Setup a temporary key with the distinguishable values for each trip
        const uniquePatternCode = `${trip.route_id}_${trip.direction_id}`;
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
            line_code: line.code,
            direction: trip.direction_id,
            short_name: line.short_name,
            headsign: trip.trip_headsign,
            color: line.color,
            text_color: line.text_color,
            trips: [parsedTrip],
          });
        }
      }
      //
    }
    // Update patterns in Database
    for (const pattern of uniquePatterns) {
      const updatedPatternDocument = await GTFSAPIDB.Pattern.findOneAndReplace({ code: pattern.code }, pattern, { new: true, upsert: true });
      updatedPatternIds.push(updatedPatternDocument._id.toString());
      line.pattern_codes.push(pattern.code);
    }
    // Save this line to MongoDB and hold on to the returned _id value
    const updatedLineDocument = await GTFSAPIDB.Line.findOneAndReplace({ code: line.code }, line, { new: true, upsert: true });
    console.log(`Done with line ${line.code}`);
    // Send result to main thread
    updatedLineIds.push(updatedLineDocument._id.toString());
    //
  }
  // Return _id to main thread
  return { updatedLineIds, updatedPatternIds };
  //
};
