/* * */

import 'dotenv/config';

/* * */

import SERVERDB from '@/services/SERVERDB.js';
import fastify from 'fastify';

/* * */

import datasetsConnectionsBoatStationsEndpoint from '@/endpoints/datasets/connections.boat_stations.endpoint.js';
import datasetsConnectionsLightRailStationsEndpoint from '@/endpoints/datasets/connections.light_rail_stations.endpoint.js';
import datasetsConnectionsSubwayStationsEndpoint from '@/endpoints/datasets/connections.subway_stations.endpoint.js';
import datasetsConnectionsTrainStationsEndpoint from '@/endpoints/datasets/connections.train_stations.endpoint.js';
import datasetsDemandDateLineStopEndpoint from '@/endpoints/datasets/demand.date-line-stop.endpoint.js';
import datasetsFacilitiesEncmEndpoint from '@/endpoints/datasets/facilities.encm.endpoint.js';
import datasetsFacilitiesEndpoint from '@/endpoints/datasets/facilities.endpoint.js';
import datasetsFacilitiesPipEndpoint from '@/endpoints/datasets/facilities.pip.endpoint.js';
import datasetsFacilitiesSchoolsEndpoint from '@/endpoints/datasets/facilities.schools.endpoint.js';
import timeEndpoint from '@/endpoints/debug/time.endpoint.js';
import networkAlertsEndpoint from '@/endpoints/network/alerts.endpoint.js';
import networkArchivesEndpoint from '@/endpoints/network/archives.endpoint.js';
import networkDatesEndpoint from '@/endpoints/network/dates.endpoint.js';
import networkFeedEndpoint from '@/endpoints/network/feed.endpoint.js';
import networkLinesEndpoint from '@/endpoints/network/lines.endpoint.js';
import networkLocalitiesEndpoint from '@/endpoints/network/localities.endpoint.js';
import networkMunicipalitiesEndpoint from '@/endpoints/network/municipalities.endpoint.js';
import networkPatternsEndpoint from '@/endpoints/network/patterns.endpoint.js';
import networkPeriodsEndpoint from '@/endpoints/network/periods.endpoint.js';
import networkRoutesEndpoint from '@/endpoints/network/routes.endpoint.js';
import networkShapesEndpoint from '@/endpoints/network/shapes.endpoint.js';
import networkStopsEndpoint from '@/endpoints/network/stops.endpoint.js';
import networkTimetablesEndpoint from '@/endpoints/network/timetables.endpoint.js';
import networkVehiclesEndpoint from '@/endpoints/network/vehicles.endpoint.js';

/* * */

const server = fastify({ logger: true, requestTimeout: 10000 });

/* * */

// DEBUG ENDPOINTS

server.get('/time', timeEndpoint.time);

/* * */

// NETWORK ENDPOINTS

server.get('/gtfs', networkFeedEndpoint.gtfs);
// server.get('/netex', networkFeedEndpoint.netex);

server.get('/alerts', networkAlertsEndpoint.json);
server.get('/alerts.pb', networkAlertsEndpoint.protobuf);
// server.get('/alerts.rss', networkAlertsEndpoint.rss);

server.get('/municipalities', networkMunicipalitiesEndpoint.all);
server.get('/municipalities/:id', networkMunicipalitiesEndpoint.single);

server.get('/localities', networkLocalitiesEndpoint.all);
server.get('/localities/:id', networkLocalitiesEndpoint.single);

server.get('/periods', networkPeriodsEndpoint.all);

server.get('/dates', networkDatesEndpoint.all);
server.get('/dates/:date', networkDatesEndpoint.single);

server.get('/archives', networkArchivesEndpoint.all);
server.get('/archives/:id', networkArchivesEndpoint.single);

server.get('/timetables', networkTimetablesEndpoint.index);
server.get('/timetables/:line_id/:direction_id/:stop_id', networkTimetablesEndpoint.single);

server.get('/lines', networkLinesEndpoint.all);
server.get('/lines/:id', networkLinesEndpoint.single);

server.get('/routes', networkRoutesEndpoint.all);
server.get('/routes/:id', networkRoutesEndpoint.single);

server.get('/patterns', networkPatternsEndpoint.all);
server.get('/patterns/:id', networkPatternsEndpoint.single);
server.get('/patterns/:id/realtime', networkPatternsEndpoint.realtime);
server.get('/network/v2/patterns/:id', networkPatternsEndpoint.v2);

server.get('/shapes', networkShapesEndpoint.all);
server.get('/shapes/:id', networkShapesEndpoint.single);

server.get('/stops', networkStopsEndpoint.all);
// server.get('/stops.pb', networkStopsEndpoint.protobuf);
server.get('/stops/:id', networkStopsEndpoint.single);
server.get('/stops/:id/realtime', networkStopsEndpoint.singleWithRealtime);
server.post('/stops/pip', networkStopsEndpoint.realtimeForPips);

server.get('/vehicles', networkVehiclesEndpoint.json);
server.get('/vehicles.pb', networkVehiclesEndpoint.protobuf);

/* * */

// DATASETS ENDPOINTS

server.get('/datasets/facilities', datasetsFacilitiesEndpoint.all);

//
// DATASETS > FACILITIES

server.get('/datasets/facilities/schools', datasetsFacilitiesSchoolsEndpoint.all);
server.get('/datasets/facilities/schools/:id', datasetsFacilitiesSchoolsEndpoint.single);

server.get('/datasets/facilities/encm', datasetsFacilitiesEncmEndpoint.all);
server.get('/datasets/facilities/encm/:id', datasetsFacilitiesEncmEndpoint.single);

server.get('/datasets/facilities/pip', datasetsFacilitiesPipEndpoint.all);
server.get('/datasets/facilities/pip/:id', datasetsFacilitiesPipEndpoint.single);

//
// DATASETS > MODAL CONNECTIONS

server.get('/datasets/connections/boat_stations', datasetsConnectionsBoatStationsEndpoint.all);
server.get('/datasets/connections/boat_stations/:id', datasetsConnectionsBoatStationsEndpoint.single);

server.get('/datasets/connections/light_rail_stations', datasetsConnectionsLightRailStationsEndpoint.all);
server.get('/datasets/connections/light_rail_stations/:id', datasetsConnectionsLightRailStationsEndpoint.single);

server.get('/datasets/connections/subway_stations', datasetsConnectionsSubwayStationsEndpoint.all);
server.get('/datasets/connections/subway_stations/:id', datasetsConnectionsSubwayStationsEndpoint.single);

server.get('/datasets/connections/train_stations', datasetsConnectionsTrainStationsEndpoint.all);
server.get('/datasets/connections/train_stations/:id', datasetsConnectionsTrainStationsEndpoint.single);

//
// DATASESTS > DEMAND

server.get('/datasets/demand/date-line-stop/viewByDateForEachStop', datasetsDemandDateLineStopEndpoint.viewByDateForEachStop);
server.get('/datasets/demand/date-line-stop/viewByDateForEachLine', datasetsDemandDateLineStopEndpoint.viewByDateForEachLine);
server.get('/datasets/demand/date-line-stop/viewByDateForEachStopForEachLine', datasetsDemandDateLineStopEndpoint.viewByDateForEachStopForEachLine);

/* * */

// START FASTIFY SERVER

server.listen({ host: '0.0.0.0', port: 5050 }, async (err, address) => {
	if (err) throw err;
	console.log(`Server listening on ${address}`);
	await SERVERDB.connect();
});
