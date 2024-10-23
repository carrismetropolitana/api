import { BasicAuth, QueryIterator, QueryResult, Trino } from 'trino-client';

export interface TrinoOptions {
  host: string;
  user: string;
  password?: string;
  catalog: string;
  schema: string;
}

export interface QueryOptions {
  where?: Record<string, any>;
  limit?: number;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
}

export class TrinoService {
  private client: Trino;
  private catalog: string;
  private schema: string;

  constructor(options: TrinoOptions) {
    this.catalog = options.catalog;
    this.schema = options.schema;

    this.client = Trino.create({
      server: options.host,
      auth: new BasicAuth(options.user, options.password),
    });
  }

  /**
   * Constructs a WHERE clause from the given filter object, escaping values to prevent SQL injection.
   */
  private buildWhereClause(where?: Record<string, any>): string {
    if (!where) return '';
    const conditions = Object.entries(where)
      .map(([key, value]) => `${key} = ${typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value}`)
      .join(' AND ');
    return `WHERE ${conditions}`;
  }

  /**
   * Fetches column headers for the given table.
   */
  private async getColumnHeaders(table: string): Promise<string[]> {
    const sqlHeaders = `DESCRIBE ${table}`;
    const headersIterator = await this.executeQuery(sqlHeaders);
    
    const columnHeaders: string[] = [];
    for (let result = await headersIterator.next(); !result.done; result = await headersIterator.next()) {
      result.value?.data?.forEach((value) => columnHeaders.push(value[0]));
    }

    return columnHeaders;
  }

  /**
   * Converts query result iterators to an array of objects using column headers.
   */
  private async convertIteratorToObject(headers: string[], resultsIterator: AsyncIterator<QueryResult>): Promise<Record<string, any>[]> {
    const results: any[] = [];
    
    for (let result = await resultsIterator.next(); !result.done; result = await resultsIterator.next()) {
      result.value?.data?.forEach((row) => {
        const rowObj = headers.reduce((acc, header, index) => {
          acc[header] = row[index];
          return acc;
        }, {} as Record<string, any>);
        results.push(rowObj);
      });
    }

    return results;
  }

  /**
   * Executes the SQL query and returns an AsyncIterator.
   */
  async executeQuery(sql: string): Promise<AsyncIterator<QueryResult>> {
    try {
      return await this.client.query({
        query: sql,
        catalog: this.catalog,
        schema: this.schema,
      });
    } catch (error) {
      console.error(`Error executing query: ${sql}`, error);
      throw new Error(`Failed to execute query: ${error.message}`);
    }
  }

  /**
   * Generic method for fetching query results based on options.
   */
  private async fetchResults<T>(sql: string, table: string): Promise<T[]> {
    const headers = await this.getColumnHeaders(table);
    const resultsIterator = await this.executeQuery(sql);

    return await this.convertIteratorToObject(headers, resultsIterator) as T[];
  }

  /**
   * Finds a single unique row based on the given conditions.
   */
  async findUnique<T>(table: string, options: QueryOptions): Promise<T | null> {
    const whereClause = this.buildWhereClause(options.where);
    const sql = `SELECT * FROM ${table} ${whereClause} LIMIT 1`;

    const results = await this.fetchResults<T>(sql, table);

    if (results.length > 1) throw new Error(`Expected 1 result, got ${results.length}`);
    return results[0] || null;
  }

  /**
   * Finds the first row matching the conditions.
   */
  async findFirst<T>(table: string, options: QueryOptions): Promise<T | null> {
    const whereClause = this.buildWhereClause(options.where);
    const sql = `SELECT * FROM ${table} ${whereClause} LIMIT 1`;

    const results = await this.fetchResults<T>(sql, table);
    return results[0] || null;
  }

  /**
   * Finds multiple rows matching the conditions.
   */
  async findMany<T>(table: string, options?: QueryOptions): Promise<T[]> {
    const whereClause = this.buildWhereClause(options?.where);
    const limit = options?.limit || 200;
    const sql = `SELECT * FROM ${table} ${whereClause} LIMIT ${limit}`;

    return await this.fetchResults<T>(sql, table);
  }
}
