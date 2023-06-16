// updateShapesWorker.js

const GTFSAPIDB = require('../databases/gtfsapidb');
const turf = require('@turf/turf');

module.exports = async ({ shape }) => {
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
  parsedShape.extension = shapeExtensionKm ? shapeExtensionKm / 1000 : 0;
  // Update or create new document
  const updatedShapeDocument = await GTFSAPIDB.Shape.findOneAndReplace({ code: parsedShape.code }, parsedShape, { new: true, upsert: true });
  // Return _id to main thread
  return updatedShapeDocument._id;
};
