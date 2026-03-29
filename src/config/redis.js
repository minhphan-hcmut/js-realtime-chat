import { createClient } from "redis";
import logger  from "../utils/logger.js";
import config from './index.js'

const redisClient = createClient({
    url: config.redis_url || 'redis://localhost:6379'
});

redisClient.on('error', (err) => logger.error('Redis client error', err))

export const connectRedis = async () => {
    await redisClient.connect();
    logger.info('Connected to Redis');
}

export default redisClient;