/* * */
/* IMPORTS */
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');
const turf = require('@turf/helpers');

/**
 * UPDATE SHAPES
 * Query 'shapes' table to get all unique shapes already pre-formatted
 * to the final schema. For each result, create it's GeoJson representation
 * and save it to MongoDB.
 * @async
 */
module.exports = async () => {
  // Record the start time to later calculate operation duration
  console.log(`⤷ Updating Shapes...`);
  const startTime = process.hrtime();
  // Query Postgres for all unique shapes by shape_id
  const allShapes = await GTFSParseDB.connection.query(`
        SELECT
            shape_id AS code,
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
  // Initate a temporary variable to hold updated Shapes
  let updatedShapeIds = [];
  // For each shape, update its entry in the database
  for (const shape of allShapes.rows) {
    // Initiate a variable to hold the parsed shape
    let parsedShape = { ...shape };
    // Sort points to match sequence
    const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
    parsedShape.points.sort((a, b) => collator.compare(a.shape_pt_sequence, b.shape_pt_sequence));
    // Create geojson feature using turf
    parsedShape.geojson = turf.lineString(parsedShape.points.map((point) => [parseFloat(point.shape_pt_lon), parseFloat(point.shape_pt_lat)]));
    // Update or create new document
    const updatedShapeDocument = await GTFSAPIDB.Shape.findOneAndReplace({ code: parsedShape.code }, parsedShape, { new: true, upsert: true });
    updatedShapeIds.push(updatedShapeDocument._id);
  }
  // Log count of updated Shapes
  console.log(`⤷ Updated ${updatedShapeIds.length} Shapes.`);
  // Delete all Shapes not present in the current update
  const deletedStaleShapes = await GTFSAPIDB.Shape.deleteMany({ _id: { $nin: updatedShapeIds } });
  console.log(`⤷ Deleted ${deletedStaleShapes.deletedCount} stale Shapes.`);
  // Log elapsed time in the current operation
  const elapsedTime = timeCalc.getElapsedTime(startTime);
  console.log(`⤷ Done updating Shapes (${elapsedTime}).`);
  //
};
