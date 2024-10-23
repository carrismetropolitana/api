/* * */

import FastifyService from '@carrismetropolitana/api-services/fastify.service';
import { FastifyServerOptions } from 'fastify';

/* * */

const options: FastifyServerOptions = {
	ignoreTrailingSlash: true,
	logger: {
		level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
		transport: process.env.NODE_ENV === 'development' && {
			options: {
				colorize: true,
			},
			target: 'pino-pretty',
		},
	},
};

export const FASTIFY = FastifyService.getInstance(options);
