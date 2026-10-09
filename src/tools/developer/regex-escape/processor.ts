/** TOOLBOX v0.11.0 — processor */
import type { ToolError } from "../../../core/types.ts";
export interface Input { text: string; }
export interface Output { text: string; }
export function validate(input: unknown): ToolError | null { const v=input as Partial<Input>|null; return !v || typeof v.text!=="string" ? {code:"USER_INPUT",what:"입력이 올바르지 않습니다.",why:"텍스트가 필요합니다.",how:"텍스트를 입력하세요."}:null; }
export async function process(input: Input): Promise<Output> { return {text:input.text.replace(/[.*+?^()|[\]{}$\/]/g,"\$&")}; }
