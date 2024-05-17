/* * */

import 'dotenv/config';
import SERVERDB from './services/SERVERDB';
import fastify from 'fastify';

/* * */

import timeEndpoint from '@/endpoints/debug/time.endpoint';

import networkFeedEndpoint from '@/endpoints/network/feed.endpoint';
import networkAlertsEndpoint from '@/endpoints/network/alerts.endpoint';
import networkMunicipalitiesEndpoint from '@/endpoints/network/municipalities.endpoint';
import networkLocalitiesEndpoint from '@/endpoints/network/localities.endpoint';
import networkPeriodsEndpoint from '@/endpoints/network/periods.endpoint';
import networkDatesEndpoint from '@/endpoints/network/dates.endpoint';
import networkArchivesEndpoint from '@/endpoints/network/archives.endpoint';
import networkTimetablesEndpoint from '@/endpoints/network/timetables.endpoint';
import networkLinesEndpoint from '@/endpoints/network/lines.endpoint';
import networkRoutesEndpoint from '@/endpoints/network/routes.endpoint';
import networkPatternsEndpoint from '@/endpoints/network/patterns.endpoint';
import networkShapesEndpoint from '@/endpoints/network/shapes.endpoint';
import networkStopsEndpoint from '@/endpoints/network/stops.endpoint';
import networkVehiclesEndpoint from '@/endpoints/network/vehicles.endpoint';

import datasetsFacilitiesEndpoint from '@/endpoints/datasets/facilities.endpoint';
import datasetsFacilitiesSchoolsEndpoint from '@/endpoints/datasets/facilities.schools.endpoint';
import datasetsFacilitiesEncmEndpoint from '@/endpoints/datasets/facilities.encm.endpoint';
import datasetsFacilitiesPipEndpoint from '@/endpoints/datasets/facilities.pip.endpoint';

import datasetsConnectionsBoatStationsEndpoint from '@/endpoints/datasets/connections.boat_stations.endpoint';
import datasetsConnectionsLightRailStationsEndpoint from '@/endpoints/datasets/connections.light_rail_stations.endpoint';
import datasetsConnectionsSubwayStationsEndpoint from '@/endpoints/datasets/connections.subway_stations.endpoint';
import datasetsConnectionsTrainStationsEndpoint from '@/endpoints/datasets/connections.train_stations.endpoint';

import datasetsDemandDateLineStopEndpoint from '@/endpoints/datasets/demand.date-line-stop.endpoint';

/* * */

fastify({ logger: true, requestTimeout: 10000 });

/* * */

// DEBUG ENDPOINTS

fastify.get('/time', timeEndpoint.time);

/* * */

// NETWORK ENDPOINTS

fastify.get('/gtfs', networkFeedEndpoint.gtfs);
// fastify.get('/netex', networkFeedEndpoint.netex);

fastify.get('/alerts', networkAlertsEndpoint.json);
fastify.get('/alerts.pb', networkAlertsEndpoint.protobuf);
// fastify.get('/alerts.rss', networkAlertsEndpoint.rss);

fastify.get('/municipalities', networkMunicipalitiesEndpoint.all);
fastify.get('/municipalities/:id', networkMunicipalitiesEndpoint.single);

fastify.get('/localities', networkLocalitiesEndpoint.all);
fastify.get('/localities/:id', networkLocalitiesEndpoint.single);

fastify.get('/periods', networkPeriodsEndpoint.all);

fastify.get('/dates', networkDatesEndpoint.all);
fastify.get('/dates/:date', networkDatesEndpoint.single);

fastify.get('/archives', networkArchivesEndpoint.all);
fastify.get('/archives/:id', networkArchivesEndpoint.single);

fastify.get('/timetables', networkTimetablesEndpoint.index);
fastify.get('/timetables/:line_id/:direction_id/:stop_id', networkTimetablesEndpoint.single);

fastify.get('/lines', networkLinesEndpoint.all);
fastify.get('/lines/:id', networkLinesEndpoint.single);

fastify.get('/routes', networkRoutesEndpoint.all);
fastify.get('/routes/:id', networkRoutesEndpoint.single);

fastify.get('/patterns', networkPatternsEndpoint.all);
fastify.get('/patterns/:id', networkPatternsEndpoint.single);
fastify.get('/patterns/:id/realtime', networkPatternsEndpoint.realtime);
fastify.get('/network/v2/patterns/:id', networkPatternsEndpoint.v2);

fastify.get('/shapes', networkShapesEndpoint.all);
fastify.get('/shapes/:id', networkShapesEndpoint.single);

fastify.get('/stops', networkStopsEndpoint.all);
// fastify.get('/stops.pb', networkStopsEndpoint.protobuf);
fastify.get('/stops/:id', networkStopsEndpoint.single);
fastify.get('/stops/:id/realtime', networkStopsEndpoint.singleWithRealtime);
fastify.post('/stops/pip', networkStopsEndpoint.realtimeForPips);

fastify.get('/vehicles', networkVehiclesEndpoint.json);
fastify.get('/vehicles.pb', networkVehiclesEndpoint.protobuf);

/* * */

// DATASETS ENDPOINTS

fastify.get('/datasets/facilities', datasetsFacilitiesEndpoint.all);

//
// DATASETS > FACILITIES

fastify.get('/datasets/facilities/schools', datasetsFacilitiesSchoolsEndpoint.all);
fastify.get('/datasets/facilities/schools/:id', datasetsFacilitiesSchoolsEndpoint.single);

fastify.get('/datasets/facilities/encm', datasetsFacilitiesEncmEndpoint.all);
fastify.get('/datasets/facilities/encm/:id', datasetsFacilitiesEncmEndpoint.single);

fastify.get('/datasets/facilities/pip', datasetsFacilitiesPipEndpoint.all);
fastify.get('/datasets/facilities/pip/:id', datasetsFacilitiesPipEndpoint.single);

//
// DATASETS > MODAL CONNECTIONS

fastify.get('/datasets/connections/boat_stations', datasetsConnectionsBoatStationsEndpoint.all);
fastify.get('/datasets/connections/boat_stations/:id', datasetsConnectionsBoatStationsEndpoint.single);

fastify.get('/datasets/connections/light_rail_stations', datasetsConnectionsLightRailStationsEndpoint.all);
fastify.get('/datasets/connections/light_rail_stations/:id', datasetsConnectionsLightRailStationsEndpoint.single);

fastify.get('/datasets/connections/subway_stations', datasetsConnectionsSubwayStationsEndpoint.all);
fastify.get('/datasets/connections/subway_stations/:id', datasetsConnectionsSubwayStationsEndpoint.single);

fastify.get('/datasets/connections/train_stations', datasetsConnectionsTrainStationsEndpoint.all);
fastify.get('/datasets/connections/train_stations/:id', datasetsConnectionsTrainStationsEndpoint.single);

//
// DATASESTS > DEMAND

fastify.get('/datasets/demand/date-line-stop/viewByDateForEachStop', datasetsDemandDateLineStopEndpoint.viewByDateForEachStop);
fastify.get('/datasets/demand/date-line-stop/viewByDateForEachLine', datasetsDemandDateLineStopEndpoint.viewByDateForEachLine);
fastify.get('/datasets/demand/date-line-stop/viewByDateForEachStopForEachLine', datasetsDemandDateLineStopEndpoint.viewByDateForEachStopForEachLine);

/* * */

// START FASTIFY SERVER

fastify.listen({ port: 5050, host: '0.0.0.0' }, async (err, address) => {
	if (err) throw err;
	console.log(`Server listening on ${address}`);
	await SERVERDB.connect();
});