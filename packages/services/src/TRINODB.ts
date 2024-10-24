
/* * */
import { readFileSync } from 'fs';

import { QueryOptions, TrinoService } from './trino.service.js';
import { SshConfig, SshTunnelService, SshTunnelServiceOptions } from './ssh-tunnel.service.js';
import { AddressInfo } from 'net';

import { TrinoValidations } from '@carrismetropolitana/api-types/trino';

/* * */

const sshConfig: SshConfig = {
	forwardOptions: {
		dstAddr: process.env.TRINO_TUNNEL_REMOTE_HOST,
		dstPort: Number(process.env.TRINO_TUNNEL_REMOTE_PORT),
		srcAddr: process.env.TRINO_TUNNEL_LOCAL_HOST,
		srcPort: Number(process.env.TRINO_TUNNEL_LOCAL_PORT),
	},
	serverOptions: {
		port: Number(process.env.TRINO_TUNNEL_LOCAL_PORT),
	},
	sshOptions: {
		host: process.env.TRINO_SSH_HOST,
		keepaliveCountMax: 3, // Retry 3 times before closing the connection
		keepaliveInterval: 10000, // Send keep-alive every 10 seconds
		port: process.env.TRINO_SSH_PORT,
		privateKey: process.env.TRINO_SSH_KEY_PATH ? readFileSync(process.env.TRINO_SSH_KEY_PATH) : undefined,
		username: process.env.TRINO_SSH_USERNAME,
	},
	tunnelOptions: {
		autoClose: false,
	},
};

const sshOptions: SshTunnelServiceOptions = {
	maxRetries: 3,
};

export interface CountValidationsOptions {
	timeUnit?: 'day' | 'hour' | 'month' | 'year' | 'quarter' | 'week',
	type?: 'line' | 'stop',
	options?: Omit<QueryOptions, 'orderBy'>
}

export interface CountValidationsResult {
	count_result: number,
	item_id?: string,
	transaction_time: string,
}

class TRINODBClass {
	private static _instance: TRINODBClass;
	private sshTunnelService: SshTunnelService;
	private trinoService: TrinoService;

	private constructor() {
		this.sshTunnelService = new SshTunnelService(sshConfig, sshOptions);
	}

	public static getInstance() {
		if (!TRINODBClass._instance) {
			TRINODBClass._instance = new TRINODBClass();
		}

		return TRINODBClass._instance;
	}

	async connect() {
		try {
			// Connect to the SSH tunnel
			await this.sshTunnelService.connect();
            
			if (this.sshTunnelService.server) {
				// Connect to the Trino service
				this.trinoService = new TrinoService({
					host: `http://${process.env.TRINO_TUNNEL_LOCAL_HOST}:${(this.sshTunnelService.server?.address() as AddressInfo).port}`,
                    user: process.env.TRINODB_USER || 'undefined',
					catalog: process.env.TRINODB_CATALOG || 'undefined',
					schema: process.env.TRINODB_SCHEMA || 'undefined',
				});

				console.log(`⤷ Connected to TRINODB.`);
			}
		}
		catch (error) {
			console.error('Error connecting to TRINODB', error);
			throw new Error('Error connecting to TRINODB');
		}
	}

	async getValidations(options?: QueryOptions) {
		return await this.trinoService.findMany<TrinoValidations>('t_stg_validations', options);
	}

	async countValidations({
		timeUnit,
		type,
		options,
	}: {
		timeUnit?: 'day' | 'hour' | 'month' | 'year' | 'quarter' | 'week',
		type?: 'line' | 'stop',
		options?: Omit<QueryOptions, 'orderBy'>
	}): Promise<CountValidationsResult[]> {
		const typeId = type === 'line' ? 'linelongid' : 'stoplongid';
		const whereClause = this.trinoService.buildWhereClause(options?.where);
		
		let timeColumn: string;
		switch (timeUnit) {
			case 'day':
				timeColumn = `DATE(CAST(REPLACE(transactiondate, 'T', ' ') AS TIMESTAMP))`;
				break;
			case 'hour':
				timeColumn = `DATE_TRUNC('hour', CAST(REPLACE(transactiondate, 'T', ' ') AS TIMESTAMP))`;
				break;
			case 'month':
				timeColumn = `DATE_TRUNC('month', CAST(REPLACE(transactiondate, 'T', ' ') AS TIMESTAMP))`;
				break;
			case 'year':
				timeColumn = `DATE_TRUNC('year', CAST(REPLACE(transactiondate, 'T', ' ') AS TIMESTAMP))`;
				break;
			case 'quarter':
				timeColumn = `DATE_TRUNC('quarter', CAST(REPLACE(transactiondate, 'T', ' ') AS TIMESTAMP))`;
				break;
			case 'week':
				timeColumn = `DATE_TRUNC('week', CAST(REPLACE(transactiondate, 'T', ' ') AS TIMESTAMP))`;
				break;
			default:
				throw new Error(`Invalid time unit: ${timeUnit}`);
		}
		
		const sql = type ? `
			SELECT 
				COUNT(DISTINCT transactionid) AS count_result,
				${typeId}, 
				${timeColumn} AS transaction_${timeUnit}
			FROM 
				t_stg_validations
			${whereClause}
			GROUP BY  ${typeId}, ${timeColumn}
			ORDER BY transaction_${timeUnit}
		` : `
			SELECT 
				COUNT(DISTINCT transactionid) AS count_result,
				${timeColumn} AS transaction_${timeUnit}
			FROM 
				t_stg_validations
			${whereClause}
			GROUP BY ${timeColumn}
			ORDER BY transaction_${timeUnit}
		`
		
		const resultsIterator = await this.trinoService.executeQuery(sql);
		const headers = type ? ['count_result', typeId, `transaction_${timeUnit}`] : ['count_result', `transaction_${timeUnit}`];
		const results = await this.trinoService.convertIteratorToObject(headers, resultsIterator);
		
		return results.map(result => ({
			count_result: Number(result.count_result),
			item_id: result[typeId],
			transaction_time: result[`transaction_${timeUnit}`]
		})) as CountValidationsResult[];
	}

    async rawQuery(sql: string) {
        return await this.trinoService.executeQuery(sql);
    }
}


export const TRINODB = TRINODBClass.getInstance();
