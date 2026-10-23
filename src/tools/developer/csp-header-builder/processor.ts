/** TOOLBOX v0.19.0 — CSP parser, builder, and safety diagnostics. */
import type { ToolError } from "../../../core/types.ts";
export interface CspDirective { name: string; sources: string[]; }
export interface CspResult { headerName: "Content-Security-Policy" | "Content-Security-Policy-Report-Only"; value: string; directives: CspDirective[]; warnings: string[]; errors: string[]; }
const MAX_LENGTH = 20_000;
const DIRECTIVES = new Set(["default-src","base-uri","child-src","connect-src","font-src","form-action","frame-ancestors","frame-src","img-src","manifest-src","media-src","object-src","script-src","script-src-elem","script-src-attr","style-src","style-src-elem","style-src-attr","worker-src","upgrade-insecure-requests","block-all-mixed-content","sandbox","report-uri","report-to","require-trusted-types-for","trusted-types","navigate-to","prefetch-src","webrtc-src"]);
export function validate(input: unknown): ToolError | null {
  if (typeof input !== "string" || !input.trim()) return { code:"USER_INPUT", what:"CSP 정책을 입력하세요.", why:"정책 내용이 비어 있습니다.", how:"예: default-src 'self'\nimg-src 'self' data:" };
  if (input.length > MAX_LENGTH) return { code:"USER_INPUT", what:"입력이 너무 큽니다.", why:"최대 20,000자까지 지원합니다.", how:"정책을 간단히 나누어 입력하세요." };
  if (input.includes("\0")) return { code:"USER_INPUT", what:"허용되지 않는 제어 문자가 있습니다.", why:"NUL 문자는 정책에 사용할 수 없습니다.", how:"입력에서 제어 문자를 제거하세요." };
  return null;
}
export function process(input: unknown, reportOnly = false): CspResult {
  const issue = validate(input); if (issue) throw Error(issue.what + " " + issue.how);
  const lines = (input as string).replace(/\r\n?/g,"\n").split("\n");
  const directives: CspDirective[] = []; const errors: string[] = []; const warnings: string[] = []; const seen = new Set<string>();
  for (let i=0;i<lines.length;i++) {
    const line = lines[i].trim(); if (!line || line.startsWith("#")) continue;
    if (/[\r\n\0]/.test(line)) { errors.push(`줄 ${i+1}: 제어 문자가 포함되어 있습니다.`); continue; }
    const parts = line.split(/\s+/); const name = parts.shift()!.toLowerCase(); const sources = parts;
    if (!/^[a-z][a-z0-9-]*$/.test(name)) { errors.push(`줄 ${i+1}: 잘못된 지시문 이름 '${name}'.`); continue; }
    if (!DIRECTIVES.has(name)) warnings.push(`알 수 없는 지시문 '${name}'은 브라우저에서 무시될 수 있습니다.`);
    if (seen.has(name)) { errors.push(`지시문 '${name}'이 중복되었습니다. 한 줄로 합치세요.`); continue; }
    seen.add(name);
    if (["upgrade-insecure-requests","block-all-mixed-content"].includes(name) && sources.length) warnings.push(`'${name}'은 보통 값 없이 지정합니다.`);
    if (!["upgrade-insecure-requests","block-all-mixed-content"].includes(name) && !sources.length) warnings.push(`'${name}'에 값이 없습니다.`);
    for (const source of sources) {
      if (/[;,`<>\r\n]/.test(source) || (/[\'"]/.test(source) && !/^'(?:(?:self)|(?:none)|(?:unsafe-inline)|(?:unsafe-eval)|(?:strict-dynamic)|(?:unsafe-hashes)|(?:report-sample)|(?:wasm-unsafe-eval)|(?:inline-speculation-rules)|(?:nonce-[A-Za-z0-9+/_=-]+)|(?:sha256-[A-Za-z0-9+/=]+)|(?:sha384-[A-Za-z0-9+/=]+)|(?:sha512-[A-Za-z0-9+/=]+))'$/.test(source))) errors.push(`'${name}'의 값 '${source}'에 안전하지 않은 문자가 있습니다.`);
      if (source === "*") warnings.push(`'${name}'의 와일드카드(*)는 허용 범위를 넓힙니다.`);
      if (source === "'unsafe-inline'") warnings.push(`'${name}'의 'unsafe-inline'은 인라인 스크립트/스타일 공격 방어를 약화할 수 있습니다.`);
      if (source === "'unsafe-eval'") warnings.push(`'${name}'의 'unsafe-eval'은 스크립트 실행 제한을 약화합니다.`);
      if (source === "'none'" && sources.length > 1) warnings.push(`'${name}'에서 'none'은 다른 소스와 함께 쓰면 기대대로 적용되지 않을 수 있습니다.`);
      if (/^https?:\/$/.test(source)) errors.push(`'${name}'의 출처 '${source}'가 완전하지 않습니다.`);
    }
    directives.push({ name, sources });
  }
  if (!seen.has("default-src")) warnings.push("default-src가 없습니다. 다른 리소스 유형에 대한 기본 제한을 명시적으로 검토하세요.");
  if (seen.has("object-src") && !directives.find((d)=>d.name==="object-src")?.sources.includes("'none'")) warnings.push("플러그인 콘텐츠가 필요 없다면 object-src 'none'을 고려하세요.");
  if (!seen.has("base-uri")) warnings.push("base-uri 'self' 또는 base-uri 'none'을 설정하면 base 태그 악용 위험을 줄이는 데 도움이 됩니다.");
  if (directives.some((d)=>d.name==="script-src" && d.sources.includes("*"))) warnings.push("script-src의 와일드카드는 스크립트 출처 제한을 사실상 약화합니다.");
  return { headerName: reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy", value: directives.map((d)=>d.name + (d.sources.length ? " " + d.sources.join(" ") : "")).join("; "), directives, warnings: [...new Set(warnings)], errors: [...new Set(errors)] };
}
