/* * */

import 'dotenv/config';

/* * */

import '@/endpoints/status/time.endpoint.js';
import '@/endpoints/status/message.endpoint.js';

/* * */

import '@/endpoints/locations/districts.endpoint.js';
import '@/endpoints/locations/municipalities.endpoint.js';
import '@/endpoints/locations/parishes.endpoint.js';
import '@/endpoints/locations/localities.endpoint.js';

/* * */

import '@/endpoints/facilities/facilities.endpoint.js';
import '@/endpoints/facilities/schools.endpoint.js';
import '@/endpoints/facilities/stores.endpoint.js';

/* * */

import '@/endpoints/metrics/metrics.endpoint.js';

/* * */

import '@/endpoints/network/network.endpoint.js';
import '@/endpoints/network/alerts.endpoint.js';
import '@/endpoints/network/patterns.endpoint.js';
import '@/endpoints/network/shapes.endpoint.js';
import '@/endpoints/network/vehicles.endpoint.js';
import '@/endpoints/network/arrivals.endpoint.js';

/* * */

import '@/endpoints/pips/estimates.endpoint.js';
import '@/endpoints/pips/message.endpoint.js';
