// api/[[...route]].ts
// Vercel catch-all entry point — bridges Node.js runtime to Hono app

import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../app";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Build a Web API Request from the Vercel/Node.js request
  const url = new URL(req.url!, `https://${req.headers.host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined;

  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Let Hono handle the request
  const response = await app.fetch(request);

  // Write the Hono response back to the Vercel response
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const responseBody = await response.text();
  res.end(responseBody);
}
