import pg from 'pg';
import logger from '../utils/logger.js';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'leetjudge',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  max: parseInt(process.env.DB_POOL_SIZE || '50', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Database', 'Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

export const connect = async () => {
  try {
    const client = await pool.connect();
    client.release();
    logger.info('Database', 'PostgreSQL connected successfully');
  } catch (err) {
    logger.error('Database', `Failed to connect to PostgreSQL: ${err.message}`);
    throw new Error(`Failed to connect to PostgreSQL: ${err.message}`);
  }
};

export const query = (text, params) => pool.query(text, params);
export { pool };