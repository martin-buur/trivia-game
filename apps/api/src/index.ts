import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';
import sessionsRoute from './routes/sessions';
import questionPacksRoute from './routes/question-packs';
import playersRoute from './routes/players';
import { wsManager } from './websocket';

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => {
  return c.json({ message: 'Trivia API' });
});

// Mount routes
app.route('/sessions', sessionsRoute);
app.route('/question-packs', questionPacksRoute);
app.route('/', playersRoute);

const port = 3001;
console.log(`Server is running on port ${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

// Initialize WebSocket server
wsManager.initialize(server);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  wsManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  wsManager.shutdown();
  process.exit(0);
});
