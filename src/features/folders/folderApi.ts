import { request } from "../../shared/api/client";
import type { RoomContext } from "../../shared/api/context";
import type { FolderOption } from "../../shared/api/contracts";
export const ROOT_FOLDER_PATH = "";
export async function listFolders(ctx: RoomContext, folderPath: string) {
  return (
    await request<{ folders: FolderOption[] }>(ctx, {
      url: "/folders",
      params: { storageProvider: ctx.storageProvider, folderPath },
    })
  ).folders;
}
export const createFolder = (
  ctx: RoomContext,
  parentPath: string,
  folderName: string,
) =>
  request<void>(ctx, {
    url: "/folders",
    method: "POST",
    data: { storageProvider: ctx.storageProvider, parentPath, folderName },
  });
export const renameFolder = (
  ctx: RoomContext,
  itemId: string,
  newName: string,
) =>
  request<void>(ctx, {
    url: `/folders/${encodeURIComponent(itemId)}`,
    method: "PATCH",
    data: { storageProvider: ctx.storageProvider, newName },
  });
export const deleteFolder = (ctx: RoomContext, itemId: string) =>
  request<void>(ctx, {
    url: `/folders/${encodeURIComponent(itemId)}`,
    method: "DELETE",
    params: { storageProvider: ctx.storageProvider },
  });
