import axios,{type AxiosRequestConfig} from 'axios';
import type { RequestContext } from './context';
import { ApiError } from './error';
import { expireSession,useSession } from '../../features/auth/sessionStore';
export const isDemo=import.meta.env.VITE_DEMO==='true';
export const client=axios.create({baseURL:import.meta.env.VITE_API_URL,timeout:30000});
export async function request<T>(context:RequestContext|null,config:AxiosRequestConfig):Promise<T>{
 if(!isDemo&&!client.defaults.baseURL&&!config.adapter)throw new ApiError('API não configurada. Defina VITE_API_URL no ambiente.','network');
 if(context&&useSession.getState().session?.sessionId!==context.sessionId)throw new ApiError('A sessão mudou. Atualize a página.','cancelled');
 try{const response=await client.request<T>({...config,headers:{...config.headers,...(context?{Authorization:`Bearer ${context.accessToken}`}:{ }),...(context?.roomId?{'X-Room-Id':context.roomId}:{})}});
 if(context&&useSession.getState().session?.sessionId!==context.sessionId)throw new ApiError('Resposta de sessão anterior ignorada.','cancelled');return response.data;
 }catch(e){if(e instanceof ApiError)throw e;if(axios.isCancel(e))throw new ApiError('Operação cancelada.','cancelled');if(axios.isAxiosError(e)){const status=e.response?.status;if(status===401&&context)expireSession(context.sessionId);const data=e.response?.data;throw new ApiError(typeof data?.message==='string'?data.message:status===403?'Você não tem permissão para esta ação.':e.code==='ECONNABORTED'?'A resposta demorou mais que o esperado. Confira o resultado antes de tentar novamente.':status?`Não foi possível concluir a operação (HTTP ${status}).`:'Não foi possível acessar o servidor. Verifique sua conexão.',e.code==='ECONNABORTED'?'timeout':status?'http':'network',status)}throw e}
}
