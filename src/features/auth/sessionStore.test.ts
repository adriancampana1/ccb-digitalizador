import { describe,it,expect,vi,beforeEach } from 'vitest';
import { installSession,clearSession,useSession,registerSessionCleanup,expireSession,restoreSession } from './sessionStore';
const user={accessToken:'example',name:'Teste',phone:'43999999999',canCreateRooms:true,createdAt:'',updatedAt:''};
beforeEach(()=>{vi.restoreAllMocks();clearSession();sessionStorage.clear()});
describe('session isolation',()=>{
it('creates a new identity on every authentication',()=>{const a=installSession(user);const b=installSession(user);expect(a.sessionId).not.toBe(b.sessionId)});
it('ignores expiry belonging to an old session',()=>{const a=installSession(user);const b=installSession(user);expireSession(a.sessionId);expect(useSession.getState().session).toEqual(b)});
it('clears resources when current session expires',()=>{const a=installSession(user);const cleanup=vi.fn();const unregister=registerSessionCleanup(cleanup);expireSession(a.sessionId);expect(useSession.getState().session).toBeNull();expect(cleanup).toHaveBeenCalledOnce();unregister()});
it('keeps memory session if browser storage is unavailable',()=>{const spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('blocked','SecurityError')});const a=installSession(user);expect(useSession.getState().session).toEqual(a);spy.mockRestore()});
it('rejects malformed persisted identity',()=>{sessionStorage.setItem('ccb.session',JSON.stringify({accessToken:4}));restoreSession();expect(useSession.getState().session).toBeNull()});
});
