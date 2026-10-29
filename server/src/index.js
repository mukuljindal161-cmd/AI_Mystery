import mongoose from 'mongoose';
import dns from 'node:dns';
import { readEnv } from './config/env.js';
import { createApp } from './app.js';

try {
  const env = readEnv();
  dns.setServers(['1.1.1.1']);

  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const server = createApp(env).listen(env.PORT, () =>
    console.log(`Whodunit API listening on port ${env.PORT}${env.MOCK_AI ? ' (mock AI)' : ''}`),
  );
  const stop = () =>
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} catch (error) {
  console.error(
    error.message.startsWith('Invalid environment:')
      ? error.message
      : 'Server could not start. Check MongoDB connectivity and environment configuration.',
  );
  process.exit(1);
}
