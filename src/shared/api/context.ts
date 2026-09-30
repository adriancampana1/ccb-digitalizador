export type Session = {
  sessionId: string;
  accessToken: string;
  name: string;
  phone: string;
  canCreateRooms: boolean;
};
export type RequestContext = Readonly<{
  sessionId: string;
  accessToken: string;
  roomId?: string;
}>;
export type RoomContext = RequestContext &
  Readonly<{ roomId: string; storageProvider: string }>;
