import { HandlerContext } from "$fresh/server.ts";
import en from "@/static/data/en.json" assert { type: "json" };

export const handler = (_req: Request, _ctx: HandlerContext): Response => {
  return new Response(JSON.stringify(en));
};
