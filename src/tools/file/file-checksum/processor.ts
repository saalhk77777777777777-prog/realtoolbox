/** TOOLBOX v0.13.3 */
import type { ToolError } from "../../../core/types.ts";
export interface Input { files: File[]; algorithm: "SHA-256"|"SHA-1"; }
export interface Row { name:string; bytes:number; hash:string; }
export interface Output { rows:Row[]; }
export function validate(input:unknown):ToolError|null { const v=input as Partial<Input>|null; if(!v||!Array.isArray(v.files)||v.files.length===0)return {code:"USER_INPUT",what:"파일이 선택되지 않았습니다.",why:"입력 목록이 비어 있습니다.",how:"파일을 선택하세요."}; if(v.algorithm!=="SHA-256"&&v.algorithm!=="SHA-1")return {code:"USER_INPUT",what:"해시 알고리즘이 올바르지 않습니다.",why:"지원하지 않는 알고리즘입니다.",how:"SHA-256 또는 SHA-1을 선택하세요."}; if(v.files.some(f=>!(f instanceof File)))return {code:"FILE_INVALID",what:"유효하지 않은 파일입니다.",why:"File 객체가 아닙니다.",how:"파일을 다시 선택하세요."}; return null; }
export async function process(input:Input):Promise<Output>{const rows:Row[]=[];for(const file of input.files){const digest=await crypto.subtle.digest(input.algorithm,file.size?await file.arrayBuffer():new ArrayBuffer(0));const hash=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");rows.push({name:file.name,bytes:file.size,hash});}return {rows};}
