/** TOOLBOX v0.14.0 — image-metadata-viewer processor */
import type { ToolError } from "../../../core/types.ts";
export interface Input { file: File }
export interface Output { name:string; type:string; size:number; width:number; height:number }
export function validate(input: unknown): ToolError|null { const v=input as Partial<Input>|null; if(!v||!(v.file instanceof File)) return {code:"USER_INPUT",what:"이미지 파일이 필요합니다.",why:"입력이 파일이 아닙니다.",how:"이미지 파일을 선택하세요."}; if(v.file.size===0) return {code:"FILE_INVALID",what:"빈 파일입니다.",why:"파일 크기가 0바이트입니다.",how:"정상적인 이미지 파일을 선택하세요."}; if(v.file.size>50*1024*1024) return {code:"UNSUPPORTED",what:"이미지가 너무 큽니다.",why:"50MB를 초과했습니다.",how:"더 작은 이미지를 사용하세요."}; return null }
export async function process(input:Input):Promise<Output>{ const b=await createImageBitmap(input.file); try{return {name:input.file.name,type:input.file.type,size:input.file.size,width:b.width,height:b.height}} finally {b.close?.()} }
