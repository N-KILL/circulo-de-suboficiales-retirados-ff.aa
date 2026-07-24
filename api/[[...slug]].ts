import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "./_handler.js";

export default async function (req: VercelRequest, res: VercelResponse) {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  await handler(req, res, pathname);
}
