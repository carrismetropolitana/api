/* * */

import SERVERDB from '@/services/SERVERDB';
import TIMETRACKER from '@helperkits/timer';

/* * */

import facilitiesEncmParser from '@/parsers/facilities.encm.parser.js';
import facilitiesPipParser from '@/parsers/facilities.pip.parser.js';
import facilitiesSchoolsParser from '@/parsers/facilities.schools.parser.js';

/* * */

import connectionsBoatStationsParser from '@/parsers/connections.boat_stations.parser.js';
import connectionsLightRailStationsParser from '@/parsers/connections.light_rail_stations.parser.js';
import connectionsSubwayStationsParser from '@/parsers/connections.subway_stations.parser.js';
import connectionsTrainStationsParser from '@/parsers/connections.train_stations.parser.js';

/* * */

export default async () => {
	//

	try {
		console.log();
		console.log('-----------------------------------------');
		console.log(new Date().toISOString());
		console.log('-----------------------------------------');
		console.log();

		// Store start time for logging purposes
		const globalTimer = new TIMETRACKER();
		console.log('Starting...');

		//

		console.log();
		console.log('STEP 0.1: Connect to databases');
		await SERVERDB.connect();

		//

		console.log();
		console.log('STEP 1.1. Parse datasets/facilities/encm');
		await facilitiesEncmParser();

		console.log();
		console.log('STEP 1.2. Parse datasets/facilities/schools');
		await facilitiesSchoolsParser();

		console.log();
		console.log('STEP 1.3. Parse datasets/facilities/pip');
		await facilitiesPipParser();

		//

		console.log();
		console.log('STEP 2.1. Parse datasets/connections/boat_stations');
		await connectionsBoatStationsParser();

		console.log();
		console.log('STEP 2.2. Parse datasets/connections/light_rail_stations');
		await connectionsLightRailStationsParser();

		console.log();
		console.log('STEP 2.3. Parse datasets/connections/subway_stations');
		await connectionsSubwayStationsParser();

		console.log();
		console.log('STEP 2.4. Parse datasets/connections/train_stations');
		await connectionsTrainStationsParser();

		//

		console.log();
		console.log('Disconnecting from databases...');
		await SERVERDB.disconnect();

		console.log();
		console.log('- - - - - - - - - - - - - - - - - - - - -');
		console.log(`Run took ${globalTimer.get()}.`);
		console.log('- - - - - - - - - - - - - - - - - - - - -');
		console.log();

		//
	}
	catch (err) {
		console.log('An error occurred. Halting execution.', err);
		console.log('Retrying in 10 seconds...');
		setTimeout(() => {
			process.exit(0); // End process
		}, 10000); // after 10 seconds
	}

	//
};
