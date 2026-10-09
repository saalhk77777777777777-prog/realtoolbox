/** TOOLBOX v0.14.30 — YAML Formatter processor */
export interface Input { text: string }
export function validate(x: unknown): import("../../../core/types.ts").ToolError | null {
 const v=x as Input;
 return !v || typeof v.text!=="string" || !v.text.trim() ? {code:"USER_INPUT",what:"YAML을 입력하세요.",why:"입력이 비어 있습니다.",how:"YAML 키-값 문서를 입력하세요."} : null;
}
export function process(v: Input) {
 const lines=v.text.replace(/\r\n?/g,"\n").split("\n");
 return {text:lines.map(line=>line.trim()===""? "":line.replace(/[ \t]+$/,"")).join("\n").replace(/\n+$/,""),note:"공백 정리만 수행합니다. YAML 문법 검증 기능은 아닙니다."};
}