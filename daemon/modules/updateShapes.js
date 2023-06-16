const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');
const splitIntoChunks = require('./splitIntoChunks');
const Piscina = require('piscina');
const { resolve } = require('path');

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Query Postgres for all unique shapes by shape_id
  console.log(`⤷ Querying database...`);
  const allShapes = await GTFSParseDB.connection.query(`
        SELECT
            shape_id,
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
  // Split the array into chunks
  const allChunks = splitIntoChunks(allShapes.rows, 10);
  // Initiate the worker threads for processing Shapes in parallel
  console.log(`⤷ Setting up workers for ${allShapes.rows.length} Shapes divided into ${allChunks.length} chunks...`);
  const piscina = new Piscina({ filename: resolve(__dirname, 'updateShapesWorker.js') });
  // Setup a tasks for each shape and await completion for all of them
  console.log(`⤷ Awaiting for tasks to complete...`);
  const workerResult = await Promise.all(allChunks.map(async (chunk) => await piscina.run({ chunk })));
  const updatedShapeIds = workerResult.flat();
  console.log(`⤷ Updated ${updatedShapeIds.length} Shapes.`);
  // Delete all Shapes not present in the current update
  const deletedStaleShapes = await GTFSAPIDB.Shape.deleteMany({ _id: { $nin: updatedShapeIds } });
  console.log(`⤷ Deleted ${deletedStaleShapes.deletedCount} stale Shapes.`);
  // Log how long it took to process everything
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Shapes (${elapsedTime}).`);
};
