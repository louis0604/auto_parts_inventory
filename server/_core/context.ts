import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import * as db from "../db";



async function getDevUserFallback() {
  const openId = "local:dev";
  await db.upsertUser({
    openId,
    name: "Developer",
    email: null,
    loginMethod: "local",
    role: "admin",
    lastSignedIn: new Date(),
  });
  return (await db.getUserByOpenId(openId)) ?? null;
}

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  if (!user && process.env.NODE_ENV !== "production") {
    user = await getDevUserFallback();
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
