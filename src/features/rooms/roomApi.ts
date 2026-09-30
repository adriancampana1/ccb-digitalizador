import { request } from "../../shared/api/client";
import type { RequestContext } from "../../shared/api/context";
import type {
  Room,
  ProviderMetadata,
  CreateRoomPayload,
} from "../../shared/api/contracts";
export const listRooms = (ctx: RequestContext, signal?: AbortSignal) =>
  request<Room[]>(ctx, { url: "/rooms", signal });
export const getRoom = (ctx: RequestContext, id: string) =>
  request<Room>(ctx, { url: `/rooms/${encodeURIComponent(id)}` });
export const joinRoom = (ctx: RequestContext, accessCode: string) =>
  request<Room>(ctx, {
    url: "/rooms/join",
    method: "POST",
    data: { accessCode },
  });
export const listProviders = (ctx: RequestContext) =>
  request<ProviderMetadata[]>(ctx, { url: "/providers" });
export const createRoom = (ctx: RequestContext, payload: CreateRoomPayload) =>
  request<Room>(ctx, { url: "/rooms", method: "POST", data: payload });
export const updateCredentials = (
  ctx: RequestContext,
  id: string,
  credentials: Record<string, string>,
) =>
  request<void>(ctx, {
    url: `/rooms/${encodeURIComponent(id)}/credentials`,
    method: "PUT",
    data: { credentials },
  });
export const getOAuthUrl = (ctx: RequestContext, id: string) =>
  request<{ authorizationUrl: string }>(ctx, {
    url: `/rooms/${encodeURIComponent(id)}/storage/oauth/url`,
  });
