/** TOOLBOX v0.11.0 — processor */
import type { ToolError } from "../../../core/types.ts";
export interface Input { text: string; }
export interface Output { rows: Array<{char:string,count:number}>; }
export function validate(input: unknown): ToolError | null { const v=input as Partial<Input>|null; return !v || typeof v.text!=="string" ? {code:"USER_INPUT",what:"입력이 올바르지 않습니다.",why:"텍스트가 필요합니다.",how:"텍스트를 입력하세요."}:null; }
export async function process(input: Input): Promise<Output> { const map=new Map<string,number>(); for(const ch of [...input.text]) map.set(ch,(map.get(ch)??0)+1); return {rows:[...map].sort((a,b)=>b[1]-a[1]||((a[0].trim()===""?1:0)-(b[0].trim()===""?1:0))||((a[0].codePointAt(0)??0)-(b[0].codePointAt(0)??0))) .map(([char,count])=>({char,count}))}; }
