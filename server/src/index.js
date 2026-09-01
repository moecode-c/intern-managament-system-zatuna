import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { runSeed } from './seed.js';

async function start() {
  try {
    await connectDB();
    await runSeed();
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
