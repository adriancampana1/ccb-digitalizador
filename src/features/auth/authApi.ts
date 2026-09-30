import { request } from '../../shared/api/client';import type { AuthResponse } from './types';
export const login=(input:{phone:string;password:string})=>request<AuthResponse>(null,{method:'POST',url:'/auth/login',data:input});
export const register=(input:{phone:string;password:string;name:string;accessCode:string})=>request<AuthResponse>(null,{method:'POST',url:'/auth/register',data:input});
