import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js'; // Ensure this exports an ioredis instance

export const judgeQueue = new Queue('judge_queue', { 
    connection: redisConnection 
});

export const enqueueSubmission = async (submissionId) => {
    await judgeQueue.add('submission', { submissionId });
    console.log(`Job added to queue: ${submissionId}`);
};