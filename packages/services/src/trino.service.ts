import { BasicAuth, QueryResult, Trino } from 'trino-client';

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
  unique?: boolean;
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
  buildWhereClause(where?: Record<string, any>): string {
    if (!where) return '';
  
    const conditions = Object.entries(where).map(([key, value]) => {
      if (key === '$and' && Array.isArray(value)) {
        const andConditions = value.map((condition) => {
          // Handle each condition without adding 'WHERE'
          const conditionKey = Object.keys(condition)[0];
          const conditionValue = condition[conditionKey];
          return `${conditionKey} = ${this.formatValue(conditionValue)}`;
        }).join(' AND ');
        return `(${andConditions})`;
      }
  
      if (key === '$or' && Array.isArray(value)) {
        const orConditions = value.map((condition) => {
          // Handle each condition without adding 'WHERE'
          const conditionKey = Object.keys(condition)[0];
          const conditionValue = condition[conditionKey];
          return `${conditionKey} = ${this.formatValue(conditionValue)}`;
        }).join(' OR ');
        return `(${orConditions})`;
      }
  
      if (key === '$not' && Array.isArray(value)) {
        const notConditions = value.map((condition) => {
          // Handle each condition without adding 'WHERE'
          const conditionKey = Object.keys(condition)[0];
          const conditionValue = condition[conditionKey];
          return `${conditionKey} = ${this.formatValue(conditionValue)}`;
        }).join(' AND ');
        return `NOT (${notConditions})`;
      }
  
      if (key === '$nor' && Array.isArray(value)) {
        const norConditions = value.map((condition) => {
          // Handle each condition without adding 'WHERE'
          const conditionKey = Object.keys(condition)[0];
          const conditionValue = condition[conditionKey];
          return `${conditionKey} = ${this.formatValue(conditionValue)}`;
        }).join(' OR ');
        return `NOT (${norConditions})`;
      }
  
      // Handle field-specific conditions
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle special field operators
        const subConditions = Object.entries(value).map(([operator, val]) => {
          switch (operator) {
            case '$eq':
              return `${key} = ${this.formatValue(val)}`;
            case '$gt':
              return `${key} > ${this.formatValue(val)}`;
            case '$gte':
              return `${key} >= ${this.formatValue(val)}`;
            case '$lt':
              return `${key} < ${this.formatValue(val)}`;
            case '$lte':
              return `${key} <= ${this.formatValue(val)}`;
            case '$ne':
              return `${key} != ${this.formatValue(val)}`;
            case '$in':
              const inValues = Array.isArray(val) ? val.map(v => this.formatValue(v)).join(', ') : this.formatValue(val);
              return `${key} IN (${inValues})`;
            case '$nin':
              const ninValues = Array.isArray(val) ? val.map(v => this.formatValue(v)).join(', ') : this.formatValue(val);
              return `${key} NOT IN (${ninValues})`;
            default:
              throw new Error(`Unsupported query operator: ${operator}`);
          }
        });
        return subConditions.join(' AND ');
      } else {
        // Handle standard equality
        return `${key} = ${this.formatValue(value)}`;
      }
    });
  
    return `WHERE ${conditions.join(' AND ')}`;
  }
  
  
  /**
   * Utility method to format values for SQL.
   */
  private formatValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`; // Escape single quotes in strings
    } else if (value instanceof Date) {
      return `'${value.toISOString()}'`; // Format date as ISO string
    } else {
      return value; // Assume number or boolean
    }
  }

  /**
   * Constructs an ORDER BY clause from the given options.
   */
  buildOrderByClause(orderBy?: { field: string; direction: 'asc' | 'desc' }): string {
    if (!orderBy) return '';
    return `ORDER BY ${orderBy.field} ${orderBy.direction}`;
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
  async convertIteratorToObject(headers: string[], resultsIterator: AsyncIterator<QueryResult>): Promise<Record<string, any>[]> {
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
    const orderByClause = this.buildOrderByClause(options.orderBy);
    const sql = `SELECT * FROM ${table} ${whereClause} ${orderByClause} LIMIT 1`;

    const results = await this.fetchResults<T>(sql, table);

    if (results.length > 1) throw new Error(`Expected 1 result, got ${results.length}`);
    return results[0] || null;
  }

  /**
   * Finds the first row matching the conditions.
   */
  async findFirst<T>(table: string, options: QueryOptions): Promise<T | null> {
    const whereClause = this.buildWhereClause(options.where);
    const orderByClause = this.buildOrderByClause(options.orderBy);
    const sql = `SELECT * FROM ${table} ${whereClause} ${orderByClause} LIMIT 1`;

    const results = await this.fetchResults<T>(sql, table);
    return results[0] || null;
  }

  /**
   * Finds multiple rows matching the conditions.
   */
  async findMany<T>(table: string, options?: QueryOptions): Promise<T[]> {
    const whereClause = this.buildWhereClause(options?.where);
    const orderByClause = this.buildOrderByClause(options?.orderBy);
    const sql = `SELECT ${options?.unique ? 'DISTINCT' : 'ALL'} * FROM ${table} ${whereClause} ${orderByClause} ${options?.limit ? `LIMIT ${options.limit}` : ''}`;

    return await this.fetchResults<T>(sql, table);
  }

  /**
   * Counts the number of rows matching the conditions.
   */
  async count(table: string, options?: QueryOptions): Promise<number | undefined> {
    const whereClause = this.buildWhereClause(options?.where);
    const sql = `SELECT COUNT(*) FROM ${table} ${whereClause}`;

    const results = await this.executeQuery(sql);
    
    return (await results.next()).value?.data[0][0] || undefined;
  }
}
