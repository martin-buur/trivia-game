import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import 'dotenv/config';

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => {
  return c.json({ message: 'Trivia API' });
});

const port = 3001;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});