import redisConnection from '../config/redis.js';
import logger from '../utils/logger.js';

// caching middleware using Redis
export const cacheMiddleware = (durationInSeconds) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl || req.url}`;

        try {
            const cachedResponse = await redisConnection.get(key);
            
            if (cachedResponse) {
                logger.debug('Cache', `Cache hit for ${key}`);
                return res.status(200).json(JSON.parse(cachedResponse));
            }

            logger.debug('Cache', `Cache miss for ${key}`);
            
            // Override res.json to intercept and cache the response
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                // We only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisConnection.setex(key, durationInSeconds, JSON.stringify(body))
                        .catch(err => logger.error('Cache', 'Redis set error', err));
                }
                return originalJson(body);
            };

            next();
        } catch (error) {
            logger.error('Cache', 'Redis get error', error);
            // If Redis fails, just proceed without caching
            next();
        }
    };
};

export const clearCache = async (key) => {
    try {
        await redisConnection.del(key);
        logger.debug('Cache', `Cleared cache for ${key}`);
    } catch (error) {
        logger.error('Cache', 'Redis del error', error);
    }
};
