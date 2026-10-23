/** TOOLBOX v0.21.0 — deterministic JSON Patch (RFC 6902) generator. */
import type { ToolError } from "../../../core/types.ts";
export interface PatchInput { before: string; after: string; }
export interface PatchOperation { op: "add"|"remove"|"replace"; path: string; value?: unknown; }
export interface PatchResult { patch: PatchOperation[]; text: string; summary: { added: number; removed: number; replaced: number }; warnings: string[]; }
const MAX_INPUT = 1_000_000;
export function validate(input: unknown): ToolError | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {code:"USER_INPUT",what:"JSON 두 개를 입력하세요.",why:"비교할 이전 문서와 새 문서가 필요합니다.",how:"before와 after 입력란에 각각 유효한 JSON을 넣으세요."};
  const v=input as Partial<PatchInput>;
  if(typeof v.before!=="string"||typeof v.after!=="string")return{code:"USER_INPUT",what:"입력 형식이 올바르지 않습니다.",why:"두 입력은 문자열이어야 합니다.",how:"JSON 텍스트를 입력하세요."};
  if(!v.before.trim()||!v.after.trim())return{code:"USER_INPUT",what:"입력이 비어 있습니다.",why:"두 JSON 문서가 모두 필요합니다.",how:"이전 문서와 새 문서를 모두 입력하세요."};
  if(v.before.length+v.after.length>MAX_INPUT)return{code:"USER_INPUT",what:"입력이 너무 큽니다.",why:"두 문서 합계 최대 1,000,000자까지 지원합니다.",how:"더 작은 JSON 문서로 나누어 비교하세요."};
  try{JSON.parse(v.before)}catch{return{code:"USER_INPUT",what:"이전 JSON이 올바르지 않습니다.",why:"before 문서를 파싱할 수 없습니다.",how:"쉼표, 따옴표, 괄호를 확인하세요."};}
  try{JSON.parse(v.after)}catch{return{code:"USER_INPUT",what:"새 JSON이 올바르지 않습니다.",why:"after 문서를 파싱할 수 없습니다.",how:"쉼표, 따옴표, 괄호를 확인하세요."};}
  return null;
}
function equal(a:unknown,b:unknown):boolean{return JSON.stringify(a)===JSON.stringify(b);}
function pointer(path:(string|number)[]):string{return path.map((part)=>"/"+String(part).replace(/~/g,"~0").replace(/\//g,"~1")).join("");}
function diff(a:unknown,b:unknown,path:(string|number)[],out:PatchOperation[]):void{
 if(equal(a,b))return;
 if(Array.isArray(a)&&Array.isArray(b)){
   let prefix=0;while(prefix<a.length&&prefix<b.length&&equal(a[prefix],b[prefix]))prefix++;
   let suffix=0;while(suffix<a.length-prefix&&suffix<b.length-prefix&&equal(a[a.length-1-suffix],b[b.length-1-suffix]))suffix++;
   const oldMiddle=a.slice(prefix,a.length-suffix),newMiddle=b.slice(prefix,b.length-suffix);
   if(oldMiddle.length===1&&newMiddle.length===1){diff(oldMiddle[0],newMiddle[0],[...path,prefix],out);return;}
   for(let i=a.length-suffix-1;i>=prefix;i--)out.push({op:"remove",path:pointer([...path,i])});
   for(let i=prefix;i<b.length-suffix;i++)out.push({op:"add",path:pointer([...path,i]),value:b[i]});
   return;
 }
 if(a&&b&&typeof a==="object"&&typeof b==="object"&&!Array.isArray(a)&&!Array.isArray(b)){
   const oldObj=a as Record<string,unknown>,newObj=b as Record<string,unknown>;
   for(const key of Object.keys(oldObj).filter(k=>!(k in newObj)).sort())out.push({op:"remove",path:pointer([...path,key])});
   for(const key of Object.keys(newObj).sort()){
    if(!(key in oldObj))out.push({op:"add",path:pointer([...path,key]),value:newObj[key]});
    else diff(oldObj[key],newObj[key],[...path,key],out);
   }
   return;
 }
 out.push({op:"replace",path:pointer(path),value:b});
}
export function process(input: unknown): PatchResult {
 const issue=validate(input);if(issue)throw Error(issue.what+" "+issue.how);
 const v=input as PatchInput;const before=JSON.parse(v.before) as unknown;const after=JSON.parse(v.after) as unknown;const patch:PatchOperation[]=[];
 if(equal(before,after)){}else if((Array.isArray(before)&&Array.isArray(after))||(before&&after&&typeof before==="object"&&typeof after==="object"&&!Array.isArray(before)&&!Array.isArray(after)))diff(before,after,[],patch);else patch.push({op:"replace",path:"",value:after});
 const summary={added:patch.filter(p=>p.op==="add").length,removed:patch.filter(p=>p.op==="remove").length,replaced:patch.filter(p=>p.op==="replace").length};
 const warnings:string[]=[];if(patch.some(p=>p.path===""))warnings.push("루트 전체를 교체하는 패치입니다. 적용 전 대상 JSON을 백업하세요.");if(patch.length>5000)warnings.push("패치 작업이 5,000개를 넘습니다. 대용량 변경은 검토 후 나누어 적용하세요.");
 return{patch,text:JSON.stringify(patch,null,2),summary,warnings};
}
