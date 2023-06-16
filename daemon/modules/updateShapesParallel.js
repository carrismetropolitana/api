const { Worker } = require('worker_threads');
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');
const turf = require('@turf/turf');

module.exports = async () => {
  // Record the start time to later calculate operation duration
  console.log(`⤷ Updating Shapes...`);
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

  //   const workerPromises = allShapes.map((shape) => {
  //     return new Promise((resolve, reject) => {
  //       const worker = new Worker('./updateShapesWorker.js', {
  //         workerData: { shape: shape },
  //       });
  //       worker.on('message', resolve);
  //       worker.on('error', reject);
  //       worker.on('exit', (code) => {
  //         if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
  //       });
  //     });
  //   });
  console.log('Setup workers for shapes', allShapes.rows.length);
  const updatedShapeIds = await Promise.all(
    allShapes.rows.map((shape) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker('./updateShapesWorker.js', {
          workerData: { shape: shape },
        });
        worker.on('message', (m) => {
          console.log('message received', m);
          resolve();
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
          console.log('worker terminated');
          if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
      });
    })
  );

  console.log(`⤷ Updated ${updatedShapeIds.length} Shapes.`);

  // Delete all Shapes not present in the current update
  const deletedStaleShapes = await GTFSAPIDB.Shape.deleteMany({ _id: { $nin: updatedShapeIds } });
  console.log(`⤷ Deleted ${deletedStaleShapes.deletedCount} stale Shapes.`);

  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Shapes (${elapsedTime}).`);
};
