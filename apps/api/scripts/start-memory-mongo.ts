/**
 * Starts an ephemeral MongoDB for local demo (not for production).
 * Prints MONGODB_URI and stays alive until Ctrl+C.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
const uri = mongo.getUri('nur');

console.log(uri);
console.error(`[memory-mongo] listening — database "nur"`);
console.error(`[memory-mongo] stop with Ctrl+C`);

const shutdown = async () => {
  await mongo.stop();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

await new Promise(() => undefined);
