import { beforeEach, it, expect } from "vitest";
import { AxiosError, type AxiosAdapter } from "axios";
import { request } from "./client";
import {
  installSession,
  useSession,
  clearSession,
} from "../../features/auth/sessionStore";
const login = (name: string) =>
  installSession({
    accessToken: "synthetic",
    name,
    phone: "43999999999",
    canCreateRooms: true,
  } as any);
const rejects =
  (status: number): AxiosAdapter =>
  async (config) => {
    throw new AxiosError("Failed", undefined, config, undefined, {
      data: {},
      status,
      statusText: "Failed",
      headers: {},
      config,
    });
  };
beforeEach(clearSession);
it("clears only a current 401 and retains a session on 403", async () => {
  const ctx = login("A");
  await expect(request(ctx, { adapter: rejects(403) })).rejects.toMatchObject({
    status: 403,
  });
  expect(useSession.getState().session?.sessionId).toBe(ctx.sessionId);
  await expect(request(ctx, { adapter: rejects(401) })).rejects.toMatchObject({
    status: 401,
  });
  expect(useSession.getState().session).toBeNull();
});
it("ignores a late 401 from the previous session", async () => {
  const old = login("A");
  let next: any;
  await expect(
    request(old, {
      adapter: async (config) => {
        next = login("B");
        return rejects(401)(config);
      },
    }),
  ).rejects.toMatchObject({ status: 401 });
  expect(useSession.getState().session).toEqual(next);
});
