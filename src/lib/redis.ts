import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export const getRedisClient = () => {
  if (!redisClient.isOpen) {
    throw new Error('Redis client is not connected');
  }
  return redisClient;
};

export default redisClient; 