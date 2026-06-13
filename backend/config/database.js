import pg from 'pg';
const { Pool } = pg; // pg doesn't have a default export for Pool in ESM

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

export const connect = async () => {
  try {
    const client = await pool.connect();
    client.release();
  } catch (err) {
    throw new Error(`Failed to connect to PostgreSQL: ${err.message}`);
  }
};

export const query = (text, params) => pool.query(text, params);
export { pool };