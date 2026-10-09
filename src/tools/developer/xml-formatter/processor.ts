/** TOOLBOX v0.14.31 — XML Formatter processor */
export interface Input { text: string }
export function validate(x: unknown): import("../../../core/types.ts").ToolError | null {
 const v=x as Input;
 return !v || typeof v.text!=="string" || !v.text.trim() ? {code:"USER_INPUT",what:"XML을 입력하세요.",why:"입력이 비어 있습니다.",how:"XML 문서를 입력하세요."} : null;
}
export function process(v: Input) {
 const tokens=v.text.replace(/>\s*</g,">\n<").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 let depth=0;
 const out=tokens.map(t=>{if(/^<\//.test(t))depth=Math.max(0,depth-1);const line="  ".repeat(depth)+t;if(/^<[^!?/][^>]*>$/.test(t)&&!/<\/[^>]+>$/.test(t)&&!t.endsWith("/>"))depth++;return line;}).join("\n");
 return {text:out,note:"간단한 태그 들여쓰기입니다. XML 문법을 완전히 검증하지는 않습니다."};
}