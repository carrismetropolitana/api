const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');
const Piscina = require('piscina');
const { resolve } = require('path');

module.exports = async () => {
  // Record the start time to later calculate operation duration
  console.log(`⤷ Querying database...`);
  const startTime = process.hrtime();
  // Query Postgres for all unique shapes by shape_id
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
  // Initiate the worker threads for processing Shapes in parallel
  console.log(`⤷ Setting up workers for ${allShapes.rows.length} Shapes...`);
  const piscina = new Piscina({
    maxThreads: 50,
    filename: resolve(__dirname, 'updateShapesWorker.js'),
  });
  // Setup a tasks for each shape and await completion for all of them
  console.log(`⤷ Awaiting tasks to complete...`);
  const updatedShapeIds = await Promise.all(
    allShapes.rows.map(async (shape) => {
      const result = await piscina.run({ shape: shape });
      console.log('result', result);
      return result;
    })
  );
  console.log('updatedShapeIds', updatedShapeIds);
  console.log(`⤷ Updated ${updatedShapeIds.length} Shapes.`);
  // Delete all Shapes not present in the current update
  const deletedStaleShapes = await GTFSAPIDB.Shape.deleteMany({ _id: { $nin: updatedShapeIds } });
  console.log(`⤷ Deleted ${deletedStaleShapes.deletedCount} stale Shapes.`);
  // Log how long it took to process everything
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Shapes (${elapsedTime}).`);
};
