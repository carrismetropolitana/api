/* * */

import { lineString, length } from '@turf/turf';
import SERVERDB from '@/services/SERVERDB';
import NETWORKDB from '@/services/NETWORKDB';
import collator from '@/modules/sortCollator';
import { getElapsedTime } from '@/modules/timeCalc';

/* * */

export default async () => {
	//
	// 1.
	// Record the start time to later calculate operation duration
	const startTime = process.hrtime();

	// 2.
	// Query Postgres for all unique shapes by shape_id
	console.log(`⤷ Querying database...`);
	const allShapes = await NETWORKDB.client.query<{
    shape_id: string,
    points: {
      shape_pt_lat: string,
      shape_pt_lon: string,
      shape_pt_sequence: string,
      shape_dist_traveled: string,
    }[]
  }>(`
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

	// 3.
	// Log progress
	console.log(`⤷ Updating Shapes...`);

	// 4.
	// Initiate variable to keep track of updated _ids
	const updatedShapeKeys = new Set;

	// 5.
	// Loop through each object in each chunk
	for (const shape of allShapes.rows) {
		try {
			// Initiate a variable to hold the parsed shape
			const parsedShape: {
				id: string,
				points?: any[],
				geojson?: any,
				extension?: number,
			} =
				{
					id: shape.shape_id,
				};
			// Sort points to match sequence
			parsedShape.points = shape.points.sort((a, b) => collator.compare(a.shape_pt_sequence, b.shape_pt_sequence));
			// Create geojson feature using turf
			parsedShape.geojson = lineString(parsedShape.points.map((point) => [parseFloat(point.shape_pt_lon), parseFloat(point.shape_pt_lat)]));
			// Calculate shape extension
			const shapeExtensionKm = length(parsedShape.geojson, { units: 'kilometers' });
			const shapeExtensionMeters = shapeExtensionKm ? shapeExtensionKm * 1000 : 0;
			parsedShape.extension = Math.floor(shapeExtensionMeters);
			// Update or create new document
			await SERVERDB.client.set(`shapes:${parsedShape.id}`, JSON.stringify(parsedShape));
			updatedShapeKeys.add(`shapes:${parsedShape.id}`);
			//
		} catch (error) {
			console.log('ERROR parsing shape', shape, error);
		}
	}

	// 6.
	// Delete all Shapes not present in the current update
	const allSavedShapeKeys = [];
	for await (const key of SERVERDB.client.scanIterator({ TYPE: 'string', MATCH: 'shapes:*' })) {
		allSavedShapeKeys.push(key);
	}
	const staleShapeKeys = allSavedShapeKeys.filter((id) => !updatedShapeKeys.has(id));
	if (staleShapeKeys.length) await SERVERDB.client.del(staleShapeKeys);
	console.log(`⤷ Deleted ${staleShapeKeys.length} stale Shapes.`);

	// 7.
	// Log how long it took to process everything
	const elapsedTime = getElapsedTime(startTime);
	console.log(`⤷ Done updating Shapes (${updatedShapeKeys.size} in ${elapsedTime}).`);

	//
};