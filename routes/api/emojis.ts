import { HandlerContext } from "$fresh/server.ts";
import en_us from "@/static/data/en_us.json" assert { type: "json" };

export const handler = (_req: Request, _ctx: HandlerContext): Response => {
  return new Response(JSON.stringify(en_us));
};
