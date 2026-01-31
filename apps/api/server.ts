// server.ts
// Local development server using @hono/node-server

import { serve } from "@hono/node-server";
import app from "./app";

const port = parseInt(process.env.PORT ?? "3001", 10);

console.log(`API server starting on http://localhost:${port}`);

serve({ fetch: app.fetch, port });
