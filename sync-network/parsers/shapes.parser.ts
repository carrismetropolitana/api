/* * */

import collator from '@/modules/sortCollator.js';
import NETWORKDB from '@/services/NETWORKDB.js';
import SERVERDB from '@/services/SERVERDB.js';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import * as turf from '@turf/turf';

/* * */

export default async () => {
	//

	const globalTimer = new TIMETRACKER();

	//
	// Fetch all Shapes from NETWORKDB

	LOGGER.info(`Starting...`);
	const allShapes = await NETWORKDB.client.query(`
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

	//
	// Initate a temporary variable to hold updated items

	const updatedShapeKeys = new Set();

	//
	// For each item, update its entry in the database

	for (const shape of allShapes.rows) {
		// Initiate a variable to hold the parsed shape
		const parsedShape = {
			extension: null,
			geojson: null,
			id: shape.shape_id,
			points: [],
		};
		// Sort points to match sequence
		parsedShape.points = shape.points.sort((a, b) => collator.compare(a.shape_pt_sequence, b.shape_pt_sequence));
		// Create geojson feature using turf
		parsedShape.geojson = turf.lineString(parsedShape.points.map(point => [
			Number.parseFloat(point.shape_pt_lon), Number.parseFloat(point.shape_pt_lat),
		]));
		// Calculate shape extension
		const shapeExtensionKm = turf.length(parsedShape.geojson, { units: 'kilometers' });
		const shapeExtensionMeters = shapeExtensionKm ? shapeExtensionKm * 1000 : 0;
		parsedShape.extension = Math.floor(shapeExtensionMeters);
		// Update or create new document
		await SERVERDB.client.set(`v2/network/shapes/${parsedShape.id}`, JSON.stringify(parsedShape));
		updatedShapeKeys.add(`v2/network/shapes/${parsedShape.id}`);
	}

	LOGGER.info(`Updated ${updatedShapeKeys.size} Shapes`);

	//
	// Add the 'all' option

	const allSavedShapeKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ MATCH: 'v2/network/shapes/*', TYPE: 'string' })) {
		allSavedShapeKeys.push(key);
	}

	const staleShapeKeys = allSavedShapeKeys.filter(id => !updatedShapeKeys.has(id));
	if (staleShapeKeys.length) {
		await SERVERDB.client.del(staleShapeKeys);
	}

	LOGGER.info(`Deleted ${staleShapeKeys.length} stale Shapes`);

	//

	LOGGER.success(`Done updating Shapes (${globalTimer.get()})`);

	//
};
