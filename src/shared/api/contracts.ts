export type Room = {
  id: string;
  name: string;
  storageProvider: string;
  authMode: "OAUTH" | "CREDENTIALS";
  connectionStatus: "PENDING" | "CONNECTED" | "DISCONNECTED";
  role: "MASTER" | "MEMBER";
  accessCode: string | null;
  baseFolderPath: string | null;
  status: string;
  connectedAccount: string | null;
};
export type ProviderMetadata = {
  id: string;
  displayName: string;
  authMode: "OAUTH" | "CREDENTIALS";
  available: boolean;
  fields: { name: string; label: string; secret: boolean; required: boolean }[];
};
export type CreateRoomPayload = {
  name: string;
  storageProvider: string;
  baseFolderPath?: string;
  credentials?: Record<string, string>;
};
export type DocumentResponse = {
  id: string;
  userId: string;
  title: string;
  documentType: string;
  storageProvider: string;
  storageUrl: string | null;
  storageItemId: string;
  folderPath: string | null;
  fileMetadata: {
    mimeType: string;
    fileSize: number;
    originalFileName: string;
  };
  thumbnailUrl: string | null;
  createdAt: string;
};
export type FolderOption = {
  id: string;
  name: string;
  path: string;
  hasChildren: boolean;
};
export type PagedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};
