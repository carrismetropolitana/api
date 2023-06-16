const { Worker } = require('worker_threads');

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

  // Split shapes into chunks for parallel processing
  const chunkSize = 100; // Adjust the chunk size as per your requirements
  const shapeChunks = [];
  for (let i = 0; i < allShapes.rows.length; i += chunkSize) {
    shapeChunks.push(allShapes.rows.slice(i, i + chunkSize));
  }

  const workerPromises = shapeChunks.map((shapes) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./updateShapesWorker.js', {
        workerData: { shapes },
      });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  });

  const updatedShapeIdsList = await Promise.all(workerPromises);
  const updatedShapeIds = updatedShapeIdsList.flat();

  console.log(`⤷ Updated ${updatedShapeIds.length} Shapes.`);

  // Delete all Shapes not present in the current update
  const deletedStaleShapes = await GTFSAPIDB.Shape.deleteMany({ _id: { $nin: updatedShapeIds } });
  console.log(`⤷ Deleted ${deletedStaleShapes.deletedCount} stale Shapes.`);

  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Shapes (${elapsedTime}).`);
};
