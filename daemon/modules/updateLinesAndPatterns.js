/* * */
/* IMPORTS */
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');
const splitIntoChunks = require('./splitIntoChunks');
const Piscina = require('piscina');
const { resolve } = require('path');

/**
 * UPDATE LINES AND PATTERNS
 * Query 'routes' table to get all unique routes.
 * Save each result in MongoDB.
 * @async
 */
module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Query Postgres for all unique routes
  console.log(`⤷ Querying database...`);
  const allRoutes = await GTFSParseDB.connection.query('SELECT * FROM routes');
  // Sort allRoutes array by each routes 'route_id' property ascending
  const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  allRoutes.rows.sort((a, b) => collator.compare(a.route_id, b.route_id));
  // Group all routes into lines by route_short_name
  const allLines = allRoutes.rows.reduce((result, route) => {
    // Check if the route_short_name already exists as a line
    const existingLine = result.find((line) => line.short_name === route.route_short_name);
    // Add the route to the existing line
    if (existingLine) existingLine.routes.push(route);
    // Create a new line with the route
    else {
      result.push({
        code: route.route_short_name,
        short_name: route.route_short_name,
        long_name: route.route_long_name,
        color: route.route_color ? `#${route.route_color}` : '#000000',
        text_color: route.route_text_color ? `#${route.route_text_color}` : '#FFFFFF',
        pattern_codes: [],
        routes: [route],
      });
    }
    // Return result for the next iteration
    return result;
  }, []);
  // Split the array into chunks
  const allChunks = splitIntoChunks(allLines, 1);
  // Initiate the worker threads for processing Lines in parallel
  console.log(`⤷ Setting up workers for ${allLines.length} Lines divided into ${allChunks.length} chunks...`);
  const piscina = new Piscina({ filename: resolve(__dirname, 'updateLinesAndPatternsWorker.js') });
  // Setup a tasks for each line and await completion for all of them
  console.log(`⤷ Awaiting for tasks to complete...`);
  const workerResult = await Promise.all(allChunks.map(async (chunk) => await piscina.run({ chunk })));
  const allUpdatedObjects = workerResult.flat();
  const updatedLineIds = allUpdatedObjects.map((wr) => wr.updatedLineIds).flat();
  const updatedPatternIds = allUpdatedObjects.map((wr) => wr.updatedPatternIds).flat();
  console.log(`⤷ Updated ${updatedLineIds.length} Lines and ${updatedPatternIds.length} Patterns.`);
  // Delete all Lines not present in the current update
  const deletedStaleLines = await GTFSAPIDB.Line.deleteMany({ _id: { $nin: updatedLineIds } });
  console.log(`⤷ Deleted ${deletedStaleLines.deletedCount} stale Lines.`);
  // Delete all Patterns not present in the current update
  const deletedStalePatterns = await GTFSAPIDB.Pattern.deleteMany({ _id: { $nin: updatedPatternIds } });
  console.log(`⤷ Deleted ${deletedStalePatterns.deletedCount} stale Patterns.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Lines (${elapsedTime}).`);
  //
};
