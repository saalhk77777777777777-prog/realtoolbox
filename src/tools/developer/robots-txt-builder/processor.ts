/** TOOLBOX v0.20.0 — robots.txt rules builder and diagnostics. */
import type { ToolError } from "../../../core/types.ts";
export interface RobotsOptions { userAgent: string; allow: string; disallow: string; sitemap: string; crawlDelay: string; }
export interface RobotsResult { text: string; warnings: string[]; errors: string[]; rules: number; }
const MAX_INPUT = 12_000;
export function validate(input: unknown): ToolError | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { code:"USER_INPUT", what:"설정을 확인하세요.", why:"robots.txt 생성에는 설정 객체가 필요합니다.", how:"생성기 입력란을 사용해 주세요." };
  const v=input as Partial<RobotsOptions>;
  for (const k of ["userAgent","allow","disallow","sitemap","crawlDelay"] as const) if (typeof v[k] !== "string") return { code:"USER_INPUT", what:"설정 형식이 올바르지 않습니다.", why:`${k} 값은 문자열이어야 합니다.`, how:"입력값을 다시 확인하세요." };
  if (JSON.stringify(v).length > MAX_INPUT) return { code:"USER_INPUT", what:"입력이 너무 큽니다.", why:"최대 12,000자까지 지원합니다.", how:"규칙을 간단히 나누어 입력하세요." };
  if (/\r|\n/.test(v.userAgent!)) return { code:"USER_INPUT", what:"User-agent에는 줄바꿈을 넣을 수 없습니다.", why:"헤더 줄을 의도치 않게 추가할 수 있습니다.", how:"User-agent 한 개만 입력하세요." };
  return null;
}
function paths(value: string): string[] { return [...new Set(value.split(/\r?\n|,/).map((s)=>s.trim()).filter(Boolean))]; }
export function process(input: unknown): RobotsResult {
  const issue=validate(input); if(issue) throw Error(issue.what+" "+issue.how);
  const v=input as RobotsOptions; const warnings:string[]=[];const errors:string[]=[];const lines:string[]=[];
  const agent=v.userAgent.trim()||"*";
  if (!/^[A-Za-z0-9_*.-]+$/.test(agent)) errors.push("User-agent에는 영문자, 숫자, 별표, 밑줄, 점, 하이픈만 사용할 수 있습니다.");
  lines.push(`User-agent: ${agent}`);
  const allow=paths(v.allow);const disallow=paths(v.disallow);
  for(const path of [...allow,...disallow]) { if(!path.startsWith("/")) errors.push(`경로 '${path}'는 /로 시작해야 합니다.`); if(/[\r\n#]/.test(path)) errors.push(`경로 '${path}'에 허용되지 않는 문자가 있습니다.`); }
  for(const path of allow) lines.push(`Allow: ${path}`);
  for(const path of disallow) lines.push(`Disallow: ${path}`);
  if(v.crawlDelay.trim()) { const n=Number(v.crawlDelay); if(!Number.isFinite(n)||n<0||n>3600) errors.push("Crawl-delay는 0~3600 사이 숫자여야 합니다."); else lines.push(`Crawl-delay: ${String(n)}`); }
  if(v.sitemap.trim()) { let url:URL|undefined;try{url=new URL(v.sitemap.trim())}catch{} if(!url||!['http:','https:'].includes(url.protocol)) errors.push("Sitemap은 유효한 http 또는 https URL이어야 합니다."); else lines.push(`Sitemap: ${url.href}`); }
  if(agent!=="*" && (allow.length||disallow.length)) warnings.push("규칙은 지정한 User-agent에만 적용됩니다. 모든 로봇에 적용하려면 *를 선택하세요.");
  if(disallow.includes("/") && allow.length===0) warnings.push("Disallow: /는 해당 User-agent의 전체 사이트 크롤링을 차단합니다.");
  if(!v.sitemap.trim()) warnings.push("사이트맵 URL이 없습니다. 사이트맵을 운영한다면 Sitemap 지시문을 추가하세요.");
  if(!disallow.length&&!allow.length) warnings.push("Allow/Disallow 규칙이 없습니다. 모든 경로를 허용하려는 설정인지 확인하세요.");
  return {text:lines.join("\n")+"\n",warnings:[...new Set(warnings)],errors:[...new Set(errors)],rules:lines.length};
}
