import { create } from "zustand";
import type { Session } from "../../shared/api/context";
import type { AuthResponse } from "./types";
const KEY = "ccb.session";
const cleanups = new Set<() => void>();
export const useSession = create<{ session: Session | null }>(() => ({
  session: null,
}));
export function registerSessionCleanup(fn: () => void) {
  cleanups.add(fn);
  return () => {
    cleanups.delete(fn);
  };
}
export function clearSession() {
  useSession.setState({ session: null });
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* restricted storage */
  }
  for (const fn of cleanups) fn();
}
export function installSession(input: AuthResponse): Session {
  if (
    !input.accessToken ||
    typeof input.accessToken !== "string" ||
    typeof input.phone !== "string" ||
    typeof input.name !== "string" ||
    typeof input.canCreateRooms !== "boolean"
  )
    throw new Error("Resposta de autenticação inválida.");
  clearSession();
  const session: Session = {
    sessionId: crypto.randomUUID(),
    accessToken: input.accessToken,
    name: input.name,
    phone: input.phone,
    canCreateRooms: input.canCreateRooms,
  };
  useSession.setState({ session });
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* memory session remains available */
  }
  return session;
}
export function expireSession(id: string) {
  if (useSession.getState().session?.sessionId === id) clearSession();
}
export function restoreSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;
    const value = JSON.parse(raw);
    if (
      typeof value.accessToken !== "string" ||
      !value.accessToken ||
      typeof value.phone !== "string" ||
      typeof value.name !== "string" ||
      typeof value.canCreateRooms !== "boolean"
    )
      throw new Error("invalid");
    const room = sessionStorage.getItem("ccb.room");
    installSession(value);
    if (room) {
      try {
        sessionStorage.setItem("ccb.room", room);
      } catch {
        /* selection can remain in memory */
      }
    }
  } catch {
    clearSession();
  }
}
