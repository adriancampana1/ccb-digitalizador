import { it, expect, beforeEach } from "vitest";
import { installSession, clearSession } from "../auth/sessionStore";
import {
  useRooms,
  applyRooms,
  captureRoomContext,
  switchRoom,
  registerRoomTransitionGuard,
} from "./roomStore";
import type { Room } from "../../shared/api/contracts";
const room = (id: string): Room => ({
  id,
  name: id,
  storageProvider: "google_drive",
  authMode: "OAUTH",
  connectionStatus: "CONNECTED",
  role: "MASTER",
  accessCode: "CCB-DEMO",
  baseFolderPath: "",
  status: "ACTIVE",
  connectedAccount: "demo@example.com",
});
const auth = {
  accessToken: "token",
  name: "Teste",
  phone: "43999999999",
  canCreateRooms: true,
  createdAt: "",
  updatedAt: "",
};
beforeEach(() => {
  clearSession();
  sessionStorage.clear();
});
it("ignores rooms from the previous login", () => {
  const a = installSession(auth);
  const b = installSession(auth);
  applyRooms(b.sessionId, [room("B")]);
  applyRooms(a.sessionId, [room("A")]);
  expect(captureRoomContext().roomId).toBe("B");
});
it("does not choose a disconnected room", () => {
  const a = installSession(auth);
  applyRooms(a.sessionId, [{ ...room("A"), connectionStatus: "PENDING" }]);
  expect(useRooms.getState().activeRoomId).toBeNull();
});
it("refuses room change when active task blocks it", async () => {
  const a = installSession(auth);
  applyRooms(a.sessionId, [room("A"), room("B")]);
  const remove = registerRoomTransitionGuard(async () => false);
  await switchRoom(room("B"));
  expect(captureRoomContext().roomId).toBe("A");
  remove();
});
it("captures immutable provider and room", async () => {
  const a = installSession(auth);
  applyRooms(a.sessionId, [room("A"), room("B")]);
  const context = captureRoomContext();
  await switchRoom(room("B"));
  expect(context.roomId).toBe("A");
  expect(context.storageProvider).toBe("google_drive");
});
it("does not silently select another room when the active room disappears", () => {
  const session = installSession(auth);
  applyRooms(session.sessionId, [room("A"), room("B")]);
  applyRooms(session.sessionId, [room("B")]);
  expect(useRooms.getState().activeRoomId).toBe("A");
  expect(() => captureRoomContext()).toThrow();
});
