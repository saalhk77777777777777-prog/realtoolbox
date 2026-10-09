/** TOOLBOX v0.14.34 — JS / TS Formatter processor */
export interface Input { text: string }
export function validate(x: unknown): import("../../../core/types.ts").ToolError | null {
 const v=x as Input;
 return !v||typeof v.text!=="string"||!v.text.trim()?{code:"USER_INPUT",what:"코드를 입력하세요.",why:"입력이 비어 있습니다.",how:"JavaScript 또는 TypeScript 코드를 입력하세요."}:null;
}
export function process(v: Input) {
 const s=v.text.replace(/\r\n?/g,"\n").replace(/[ \t]+$/gm,"").replace(/\n{3,}/g,"\n\n").trim();
 return {text:s,note:"후행 공백과 과도한 빈 줄만 정리합니다. 구문 분석 기반 포매터는 아닙니다."};
}