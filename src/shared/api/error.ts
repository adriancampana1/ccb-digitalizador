export class ApiError extends Error{constructor(message:string,public kind:'http'|'network'|'timeout'|'cancelled',public status?:number){super(message);this.name='ApiError'}}
export function errorMessage(error:unknown){return error instanceof Error?error.message:'Não foi possível concluir. Tente novamente.'}
