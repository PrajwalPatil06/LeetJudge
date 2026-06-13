import Redis from 'ioredis';
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Often required for robust queue workers
  retryStrategy(times) {
    if (process.env.NODE_ENV === 'test') {
      return null; 
    }
    return Math.min(times * 50, 2000);
  }
});

redisConnection.on('connect', () => console.log('Redis connected successfully.'));
redisConnection.on('error', (err) => console.error('Redis connection error:', err));

export default redisConnection;