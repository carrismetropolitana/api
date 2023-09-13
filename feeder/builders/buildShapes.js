const FEEDERDB = require('../services/FEEDERDB');
const SERVERDBREDIS = require('../services/SERVERDBREDIS');
const timeCalc = require('../modules/timeCalc');
const turf = require('@turf/turf');

/* UPDATE SHAPES */

module.exports = async () => {
  // Record the start time to later calculate operation duration
  const startTime = process.hrtime();
  // Query Postgres for all unique shapes by shape_id
  console.log(`⤷ Querying database...`);
  const allShapes = await FEEDERDB.connection.query(`
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
  // Log progress
  console.log(`⤷ Updating Shapes...`);
  // Initiate variable to keep track of updated _ids
  const updatedShapeCodes = new Set();
  // Loop through each object in each chunk
  for (const shape of allShapes.rows) {
    try {
      // Initiate a variable to hold the parsed shape
      let parsedShape = {
        code: shape.shape_id,
      };
      // Sort points to match sequence
      const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
      parsedShape.points = shape.points.sort((a, b) => collator.compare(a.shape_pt_sequence, b.shape_pt_sequence));
      // Create geojson feature using turf
      parsedShape.geojson = turf.lineString(parsedShape.points.map((point) => [parseFloat(point.shape_pt_lon), parseFloat(point.shape_pt_lat)]));
      // Calculate shape extension
      const shapeExtensionKm = turf.length(parsedShape.geojson, { units: 'kilometers' });
      const shapeExtensionMeters = shapeExtensionKm ? shapeExtensionKm * 1000 : 0;
      parsedShape.extension = parseInt(shapeExtensionMeters);
      // Update or create new document
      console.log(`shapes:${parsedShape.code}`);
      await SERVERDBREDIS.client.set(`shapes:${parsedShape.code}`, JSON.stringify(parsedShape));
      // Store object code
      updatedShapeCodes.add(parsedShape.code);
    } catch (error) {
      console.log('ERROR parsing shape', shape, error);
    }
  }
  // Delete all Shapes not present in the current update
  const allSavedShapeCodes = [];
  for await (const key of SERVERDBREDIS.client.scanIterator({ TYPE: 'string', MATCH: 'shapes:*' })) {
    console.log(key);
    allSavedShapeCodes.push(key);
  }
  const staleShapeCodes = allSavedShapeCodes.filter((code) => !updatedShapeCodes.has(code));
  SERVERDBREDIS.client.del(staleShapeCodes);
  console.log(`⤷ Deleted ${staleShapeCodes.length} stale Shapes.`);

  // Log how long it took to process everything
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Shapes (${updatedShapeCodes.size} in ${elapsedTime}).`);
};
