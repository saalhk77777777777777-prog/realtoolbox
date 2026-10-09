/** TOOLBOX v0.14.33 — CSS Formatter / Minifier processor */
export interface Input { text: string; mode?: "format"|"minify" }
export function validate(x: unknown): import("../../../core/types.ts").ToolError | null {
 const v=x as Input;
 if(!v||typeof v.text!=="string"||!v.text.trim())return {code:"USER_INPUT",what:"CSS를 입력하세요.",why:"입력이 비어 있습니다.",how:"CSS 규칙을 입력하세요."};
 if(v.mode&&v.mode!=="format"&&v.mode!=="minify")return {code:"USER_INPUT",what:"모드를 확인하세요.",why:"지원하지 않는 모드입니다.",how:"format 또는 minify를 선택하세요."};
 return null;
}
export function process(v: Input) {
 let s=v.text.replace(/\/\*[\s\S]*?\*\//g,"").trim();
 if(v.mode==="minify")s=s.replace(/\s+/g," ").replace(/\s*([{}:;,])\s*/g,"$1").replace(/;}/g,"}");
 else s=s.replace(/\s*\{\s*/g," {\n  ").replace(/;\s*/g,";\n  ").replace(/\s*\}\s*/g,"\n}\n").replace(/\n  \n/g,"\n").trim();
 return {text:s};
}