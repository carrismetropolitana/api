/**
 * This file simply wraps the RedisService class with the SERVERDB instance.
 * It is the the main (and only) entry point for the RedisService class.
 * Therefor, all projects reference this Redis instance.
 */

/* * */

import { RedisService } from './redis.service.js';

/* * */

export const SERVERDB = new RedisService({ socket: { host: process.env.SERVERDB_HOST, port: Number(process.env.SERVERDB_PORT) } });
