/** TOOLBOX v0.14.88 — Regex replace. */
import type{ToolError}from"../../../core/types.ts";
export function validate(x:unknown):ToolError|null{const v=x as Record<string,any>;return !v||typeof v.text!=="string"||typeof v.pattern!=="string"||typeof v.replacement!=="string"||typeof v.flags!=="string"||v.text.length>1000000||v.pattern.length>2000?{code:"USER_INPUT",what:"정규식 입력을 확인하세요.",why:"입력값이 없거나 너무 깁니다.",how:"텍스트 1MB 이하와 유효한 정규식 패턴을 입력하세요."}:null}
export function process(x:unknown):unknown{const e=validate(x);if(e)throw Error(e.what+" "+e.how);const v=x as any;let re:RegExp;try{re=new RegExp(v.pattern,v.flags)}catch(err){throw Error("정규식 오류: "+(err instanceof Error?err.message:"패턴 오류"))}return{result:v.text.replace(re,v.replacement),pattern:v.pattern,flags:v.flags}}
