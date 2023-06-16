// updateShapesWorker.js

const { workerData, parentPort } = require('worker_threads');
const GTFSParseDB = require('../databases/gtfsparsedb');
const GTFSAPIDB = require('../databases/gtfsapidb');
const timeCalc = require('./timeCalc');
const turf = require('@turf/turf');

const processShape = async (shape) => {
  console.log('Inside worker processShape', shape.shape_id);
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
  return updatedShapeDocument._id;
};

module.exports = async ({ shape }) => {
  try {
    const startTime = process.hrtime();
    console.log('Inside worker updateShapesWorker', startTime);

    const updatedShapeId = await processShape(shape);

    parentPort.postMessage(updatedShapeId);

    const elapsedTime = timeCalc.getElapsedTime(startTime);
    console.log(`⤷ Done updating Shapes (${elapsedTime}).`);
  } catch (error) {
    console.error(error);
  }
};
