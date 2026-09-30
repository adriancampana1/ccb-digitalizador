import { it,expect } from 'vitest';import { connectionOutcome,authorizationUrl } from './oauth';
it('requires confirmed server status rather than callback success',()=>{expect(connectionOutcome('PENDING')).toBe('pending');expect(connectionOutcome('CONNECTED')).toBe('connected')});
it('rejects native or unsafe authorization URLs',()=>{expect(()=>authorizationUrl('digitalizador://oauth/done')).toThrow();expect(()=>authorizationUrl('javascript:alert(1)')).toThrow();expect(authorizationUrl('https://accounts.example.com/auth')).toBe('https://accounts.example.com/auth')});
